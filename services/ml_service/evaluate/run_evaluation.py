#!/usr/bin/env python3
# GENERATOR: ML_EVALUATION
# CLI script to run model evaluations
# HOW TO RUN: python evaluate/run_evaluation.py --models all --output results.json

import argparse
import json
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from evaluate.model_evaluator import ModelEvaluator
from evaluate.report_generator import ReportGenerator
from evaluate.validation_set import ValidationSetManager


def main():
    parser = argparse.ArgumentParser(description='Evaluate ML models')
    parser.add_argument('--models', choices=['all', 'churn', 'ltv', 'segmentation'], 
                       default='all', help='Which models to evaluate')
    parser.add_argument('--brand-id', help='Brand ID to filter profiles')
    parser.add_argument('--output', help='Output file path (JSON)')
    parser.add_argument('--output-dir', default='./evaluation_reports', 
                       help='Output directory for reports')
    parser.add_argument('--limit', type=int, help='Limit number of profiles to evaluate')
    parser.add_argument('--validation-split', help='Use named validation split')
    parser.add_argument('--generate-reports', action='store_true', 
                       help='Generate all report formats (JSON, CSV, HTML)')
    
    args = parser.parse_args()
    
    # Initialize evaluator
    evaluator = ModelEvaluator(brand_id=args.brand_id)
    
    # Get profiles for evaluation
    profile_ids = None
    if args.validation_split:
        split_manager = ValidationSetManager(brand_id=args.brand_id)
        _, validation_ids, test_ids = split_manager.load_validation_split(args.validation_split)
        profile_ids = validation_ids + test_ids
        print(f"Using validation split '{args.validation_split}': {len(profile_ids)} profiles")
    elif args.limit:
        profile_ids = evaluator.load_test_profiles(limit=args.limit)
        print(f"Evaluating on {len(profile_ids)} profiles")
    
    # Run evaluation
    print("\n" + "="*50)
    print("Starting Model Evaluation")
    print("="*50)
    
    if args.models == 'all':
        results = evaluator.evaluate_all_models(profile_ids)
    else:
        if args.models == 'churn':
            result = evaluator.evaluate_churn_model(profile_ids)
        elif args.models == 'ltv':
            result = evaluator.evaluate_ltv_model(profile_ids)
        elif args.models == 'segmentation':
            result = evaluator.evaluate_segmentation_model(profile_ids)
        
        results = {
            'evaluation_date': result.get('evaluation_date'),
            'brand_id': args.brand_id,
            'results': {args.models: result}
        }
    
    # Print results
    print("\n" + "="*50)
    print("Evaluation Results")
    print("="*50)
    
    for model_type, result in results.get('results', {}).items():
        print(f"\n{model_type.upper()} Model:")
        if 'error' in result:
            print(f"  Error: {result['error']}")
        else:
            print(f"  Test Samples: {result.get('test_samples', 0)}")
            metrics = result.get('metrics', {})
            for metric_name, metric_value in metrics.items():
                if isinstance(metric_value, dict):
                    continue
                print(f"  {metric_name}: {metric_value}")
    
    # Save to file
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"\nResults saved to: {args.output}")
    
    # Generate reports
    if args.generate_reports:
        report_gen = ReportGenerator(output_dir=args.output_dir)
        report_paths = report_gen.generate_all_reports(results)
        print("\nGenerated Reports:")
        for format_type, path in report_paths.items():
            print(f"  {format_type.upper()}: {path}")
    
    print("\n" + "="*50)
    print("Evaluation Complete!")
    print("="*50)


if __name__ == "__main__":
    main()

