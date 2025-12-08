# Recommendation Engine - item2vec + FAISS

**Last Updated**: December 2024

## Overview

The recommendation engine uses **item2vec** (Word2Vec for products) + **FAISS** for fast similarity search to generate personalized product recommendations.

## Architecture

```
Purchase Events → Item Sequences → item2vec Training → Product Embeddings
                                                          ↓
                                                    FAISS Index
                                                          ↓
Customer History → Customer Vector → FAISS Search → Recommendations
```

## How It Works

### 1. Training Phase

1. **Extract Item Sequences**: From purchase events, extract sequences of products each customer bought
2. **Train item2vec**: Use Word2Vec to learn product embeddings (products that co-occur get similar vectors)
3. **Build FAISS Index**: Create fast similarity search index for all products
4. **Save Models**: Store item2vec model, FAISS index, and metadata

### 2. Inference Phase

1. **Get Customer History**: Retrieve customer's purchase history
2. **Create Customer Vector**: Average embeddings of customer's purchased items
3. **FAISS Search**: Find most similar products (cosine similarity)
4. **Filter & Rank**: Remove already purchased items, return top-K recommendations

## Training

### Prerequisites

```bash
pip install gensim faiss-cpu
```

### Run Training

```bash
cd services/ml_service
python3 train/train_recommendations.py --brand-id test-brand
```

**Options**:
- `--brand-id`: Filter by brand (optional)
- `--vector-size`: Embedding dimension (default: 64)
- `--window`: Context window size (default: 5)

### Training Requirements

- **Minimum**: 10 customer sequences with at least 2 items each
- **Recommended**: 100+ sequences for good quality
- **Products**: Must appear at least 2 times (min_count=2)

## Model Files

After training, these files are created:

- `item2vec_<version>.model` - Gensim Word2Vec model
- `faiss_index_<version>.index` - FAISS similarity index
- `recommendations_metadata_<version>.pkl` - Metadata (mappings, version)

## API Usage

### Get Recommendations

```bash
POST /predict/recs
Content-Type: application/json

{
  "profile_id": "uuid",
  "brand_id": "optional"
}
```

**Response**:
```json
{
  "profile_id": "uuid",
  "recommendations": [
    {
      "product_id": "prod_123",
      "category": "unknown",
      "score": 0.85
    }
  ],
  "model_version": "v1.0.0-trained",
  "timestamp": "2024-12-03T17:50:10.123Z"
}
```

### Get All Predictions (includes recommendations)

```bash
POST /predict/all
Content-Type: application/json

{
  "profile_id": "uuid"
}
```

## How Recommendations Are Generated

1. **Customer History**: Get all products customer has purchased
2. **Customer Vector**: Average embeddings of purchased products
3. **Similarity Search**: Use FAISS to find similar products
4. **Filtering**: Remove already purchased items
5. **Ranking**: Sort by similarity score (cosine similarity)

## Fallback Behavior

- **No Model**: Returns mock recommendations
- **New Customer**: Returns popular items (most frequent in vocabulary)
- **No History**: Returns popular items
- **Model Error**: Falls back to mock recommendations

## Performance

- **Training Time**: ~1-5 minutes (depends on data size)
- **Inference Time**: <10ms per recommendation
- **FAISS Index**: Supports millions of products with sub-millisecond search

## Limitations & Future Enhancements

### Current Limitations

1. **Category**: Always returns "unknown" (needs product metadata table)
2. **Cold Start**: New products not in training data can't be recommended
3. **Diversity**: No diversity filtering (may recommend similar items)
4. **Context**: No time-based or seasonal recommendations

### Future Enhancements

1. **Product Metadata**: Add product table with categories, prices, etc.
2. **Hybrid Recommendations**: Combine collaborative (item2vec) + content-based
3. **Popularity Boost**: Boost popular items for new customers
4. **Diversity**: Add diversity filtering to avoid recommending similar items
5. **Real-time Updates**: Incrementally update model as new purchases arrive
6. **Category Filtering**: Filter recommendations by category
7. **A/B Testing**: Test different recommendation strategies

## Monitoring

### Check Model Status

```bash
# Check if models are loaded
curl http://localhost:8000/health

# Check model versions
curl http://localhost:8000/models/versions?model_type=recommendations
```

### Model Metrics

Track recommendation quality:
- Click-through rate (CTR)
- Conversion rate
- Average recommendation score
- Coverage (how many products are recommended)

## Troubleshooting

### "No recommendation models found"

**Solution**: Train the model first:
```bash
python3 train/train_recommendations.py --brand-id <brand_id>
```

### "Need at least 10 customer sequences"

**Solution**: Generate more test data or wait for real purchase events:
```bash
cd backend && npm run seed
```

### "Vocabulary size: 0"

**Solution**: Products must appear at least 2 times (min_count=2). Generate more diverse purchase data.

### Recommendations are all the same

**Solution**: 
- More training data needed
- Increase vector_size (e.g., 128)
- Adjust window size
- Check product diversity in training data

## Integration with Model Versioning

The recommendation engine can be integrated with the model versioning system:

1. Save recommendation model version to `model_version` table
2. Track metrics (coverage, diversity, etc.)
3. A/B test different models
4. Rollback to previous versions

## Example: Training with Real Data

```bash
# 1. Ensure you have purchase events
curl -X POST http://localhost:3000/api/events \
  -H "x-brand-id: test-brand" \
  -d '{
    "event_type": "purchase",
    "payload": {
      "phone": "+1234567890",
      "items": [
        {"product_id": "prod_1", "quantity": 1},
        {"product_id": "prod_2", "quantity": 2}
      ]
    }
  }'

# 2. Train recommendation model
cd services/ml_service
python3 train/train_recommendations.py --brand-id test-brand

# 3. Restart ML service to load new model
# (Models auto-load on startup)

# 4. Get recommendations
curl -X POST http://localhost:8000/predict/recs \
  -H "Content-Type: application/json" \
  -d '{"profile_id": "<profile_id>"}'
```

