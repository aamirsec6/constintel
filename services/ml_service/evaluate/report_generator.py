# GENERATOR: ML_EVALUATION
# Report generation for model evaluation results
# HOW TO RUN: Import and use to generate evaluation reports

import json
import csv
from typing import Dict, Any, Optional
from datetime import datetime
from pathlib import Path


class ReportGenerator:
    """Generate evaluation reports in multiple formats"""
    
    def __init__(self, output_dir: str = "./evaluation_reports"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True, parents=True)
    
    def generate_json_report(self, evaluation_results: Dict[str, Any], filename: Optional[str] = None) -> str:
        """Generate JSON report"""
        if filename is None:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = f"evaluation_report_{timestamp}.json"
        
        filepath = self.output_dir / filename
        with open(filepath, 'w') as f:
            json.dump(evaluation_results, f, indent=2)
        
        return str(filepath)
    
    def generate_csv_report(self, evaluation_results: Dict[str, Any], filename: Optional[str] = None) -> str:
        """Generate CSV report with metrics summary"""
        if filename is None:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = f"evaluation_summary_{timestamp}.csv"
        
        filepath = self.output_dir / filename
        
        rows = []
        for model_type, result in evaluation_results.get('results', {}).items():
            if 'error' in result:
                rows.append({
                    'model_type': model_type,
                    'status': 'error',
                    'error': result['error']
                })
                continue
            
            metrics = result.get('metrics', {})
            row = {
                'model_type': model_type,
                'test_samples': result.get('test_samples', 0),
                'evaluation_date': result.get('evaluation_date', '')
            }
            
            # Add model-specific metrics
            if model_type == 'churn':
                row.update({
                    'accuracy': metrics.get('accuracy'),
                    'precision': metrics.get('precision'),
                    'recall': metrics.get('recall'),
                    'f1_score': metrics.get('f1_score'),
                    'roc_auc': metrics.get('roc_auc')
                })
            elif model_type == 'ltv':
                row.update({
                    'rmse': metrics.get('rmse'),
                    'mae': metrics.get('mae'),
                    'r2_score': metrics.get('r2_score'),
                    'mape': metrics.get('mape')
                })
            elif model_type == 'segmentation':
                row.update({
                    'adjusted_rand_index': metrics.get('adjusted_rand_index'),
                    'accuracy': metrics.get('accuracy')
                })
            
            rows.append(row)
        
        if rows:
            fieldnames = set()
            for row in rows:
                fieldnames.update(row.keys())
            
            with open(filepath, 'w', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=sorted(fieldnames))
                writer.writeheader()
                writer.writerows(rows)
        
        return str(filepath)
    
    def generate_html_report(self, evaluation_results: Dict[str, Any], filename: Optional[str] = None) -> str:
        """Generate HTML report"""
        if filename is None:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = f"evaluation_report_{timestamp}.html"
        
        filepath = self.output_dir / filename
        
        html = f"""<!DOCTYPE html>
<html>
<head>
    <title>ML Model Evaluation Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        h1 {{ color: #333; }}
        .model-section {{ margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }}
        .metrics {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-top: 10px; }}
        .metric-card {{ padding: 10px; background: #f5f5f5; border-radius: 3px; }}
        .metric-label {{ font-weight: bold; color: #666; }}
        .metric-value {{ font-size: 24px; color: #333; }}
        .error {{ color: red; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
        th, td {{ padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }}
        th {{ background-color: #f2f2f2; }}
    </style>
</head>
<body>
    <h1>ML Model Evaluation Report</h1>
    <p><strong>Evaluation Date:</strong> {evaluation_results.get('evaluation_date', 'N/A')}</p>
    <p><strong>Brand ID:</strong> {evaluation_results.get('brand_id', 'N/A')}</p>
    
"""
        
        for model_type, result in evaluation_results.get('results', {}).items():
            html += f'    <div class="model-section">\n'
            html += f'        <h2>{model_type.upper()} Model</h2>\n'
            
            if 'error' in result:
                html += f'        <p class="error">Error: {result["error"]}</p>\n'
            else:
                html += f'        <p><strong>Test Samples:</strong> {result.get("test_samples", 0)}</p>\n'
                html += '        <div class="metrics">\n'
                
                metrics = result.get('metrics', {})
                for metric_name, metric_value in metrics.items():
                    if isinstance(metric_value, dict):
                        continue  # Skip nested dicts like confusion_matrix
                    html += f"""            <div class="metric-card">
                <div class="metric-label">{metric_name.replace('_', ' ').title()}</div>
                <div class="metric-value">{metric_value if metric_value is not None else 'N/A'}</div>
            </div>
"""
                
                html += '        </div>\n'
                
                # Add confusion matrix if available
                if 'confusion_matrix' in metrics:
                    cm = metrics['confusion_matrix']
                    html += f"""        <h3>Confusion Matrix</h3>
        <table>
            <tr>
                <th></th>
                <th>Predicted: No Churn</th>
                <th>Predicted: Churn</th>
            </tr>
            <tr>
                <th>Actual: No Churn</th>
                <td>{cm.get('true_negative', 0)}</td>
                <td>{cm.get('false_positive', 0)}</td>
            </tr>
            <tr>
                <th>Actual: Churn</th>
                <td>{cm.get('false_negative', 0)}</td>
                <td>{cm.get('true_positive', 0)}</td>
            </tr>
        </table>
"""
            
            html += '    </div>\n'
        
        html += """</body>
</html>
"""
        
        with open(filepath, 'w') as f:
            f.write(html)
        
        return str(filepath)
    
    def generate_all_reports(self, evaluation_results: Dict[str, Any]) -> Dict[str, str]:
        """Generate all report formats"""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        
        return {
            'json': self.generate_json_report(evaluation_results, f"evaluation_report_{timestamp}.json"),
            'csv': self.generate_csv_report(evaluation_results, f"evaluation_summary_{timestamp}.csv"),
            'html': self.generate_html_report(evaluation_results, f"evaluation_report_{timestamp}.html")
        }

