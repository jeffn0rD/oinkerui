#!/usr/bin/env python3
"""
Master verification script that runs all specification checks.

This script orchestrates all verification tools and generates a
comprehensive report on specification quality.
"""

import sys
import os
from pathlib import Path
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from check_spec_completeness import CompletenessChecker
from check_spec_references import ReferenceChecker
from check_spec_consistency import ConsistencyChecker
from generate_traceability_matrix import TraceabilityGenerator
from generate_dependency_graphs import DependencyGraphGenerator


def print_header(title: str):
    """Print a section header."""
    print()
    print("=" * 70)
    print(title)
    print("=" * 70)


def print_subheader(title: str):
    """Print a subsection header."""
    print()
    print("-" * 50)
    print(title)
    print("-" * 50)


def main():
    """Run all specification verification checks."""
    print_header("SPECIFICATION VERIFICATION")
    print(f"Started: {datetime.now().isoformat()}")
    print(f"Working directory: {os.getcwd()}")
    
    total_errors = 0
    total_warnings = 0
    
    # 1. Check completeness
    print_subheader("1. Checking Completeness")
    try:
        completeness = CompletenessChecker()
        completeness_report = completeness.check_all()
        
        total_errors += len(completeness_report['errors'])
        total_warnings += len(completeness_report['warnings'])
        
        print(f"\n  Errors: {len(completeness_report['errors'])}")
        print(f"  Warnings: {len(completeness_report['warnings'])}")
        
        if completeness_report['errors']:
            for error in completeness_report['errors'][:5]:
                print(f"    ❌ {error['message']}")
    except Exception as e:
        print(f"  ❌ Error running completeness check: {e}")
        total_errors += 1
    
    # 2. Check references
    print_subheader("2. Checking References")
    try:
        references = ReferenceChecker()
        references_report = references.check_all_references()
        
        broken_count = len(references_report['broken_refs'])
        total_warnings += broken_count  # Treat as warnings
        
        print(f"\n  References collected: {references_report['total_refs_collected']}")
        print(f"  Valid references: {references_report['summary']['valid']}")
        print(f"  Broken references: {broken_count}")
        
        if references_report['broken_refs']:
            for ref in references_report['broken_refs'][:5]:
                print(f"    ⚠️  {ref['source']}: {ref['reference']}")
    except Exception as e:
        print(f"  ❌ Error running reference check: {e}")
        total_errors += 1
    
    # 3. Check consistency
    print_subheader("3. Checking Consistency")
    try:
        consistency = ConsistencyChecker()
        consistency_report = consistency.check_all()
        
        total_errors += len(consistency_report['errors'])
        total_warnings += len(consistency_report['warnings'])
        
        print(f"\n  Errors: {len(consistency_report['errors'])}")
        print(f"  Warnings: {len(consistency_report['warnings'])}")
        
        if consistency_report['errors']:
            for error in consistency_report['errors'][:5]:
                print(f"    ❌ {error['message']}")
    except Exception as e:
        print(f"  ❌ Error running consistency check: {e}")
        total_errors += 1
    
    # 4. Generate traceability matrices
    print_subheader("4. Generating Traceability Matrices")
    try:
        traceability = TraceabilityGenerator()
        traceability.generate_all_matrices()
        print("  ✅ Traceability matrices generated")
    except Exception as e:
        print(f"  ❌ Error generating traceability matrices: {e}")
        total_errors += 1
    
    # 5. Generate dependency graphs
    print_subheader("5. Generating Dependency Graphs")
    try:
        graphs = DependencyGraphGenerator()
        graphs.generate_all_graphs()
        print("  ✅ Dependency graphs generated")
    except Exception as e:
        print(f"  ❌ Error generating dependency graphs: {e}")
        total_errors += 1
    
    # 6. Run YAML validation
    print_subheader("6. Running YAML Validation")
    try:
        validate_yaml_path = Path(__file__).parent / "validate_yaml.py"
        if validate_yaml_path.exists():
            import subprocess
            result = subprocess.run(
                [sys.executable, str(validate_yaml_path)],
                capture_output=True,
                text=True
            )
            
            # Parse output for results
            if "Invalid: 0" in result.stdout:
                print("  ✅ All YAML files are valid")
            else:
                print("  ⚠️  Some YAML files have issues")
                total_warnings += 1
        else:
            print("  ⚠️  validate_yaml.py not found")
    except Exception as e:
        print(f"  ❌ Error running YAML validation: {e}")
        total_errors += 1
    
    # Summary
    print_header("VERIFICATION SUMMARY")
    print(f"Completed: {datetime.now().isoformat()}")
    print()
    print(f"Total Errors:   {total_errors}")
    print(f"Total Warnings: {total_warnings}")
    print()
    
    if total_errors == 0 and total_warnings == 0:
        print("✅ All specification checks passed!")
        print()
        print("Generated artifacts:")
        print("  - docs/traceability/feature_module_matrix.md")
        print("  - docs/traceability/module_function_matrix.md")
        print("  - docs/traceability/api_function_matrix.md")
        print("  - docs/traceability/workflow_function_matrix.md")
        print("  - docs/diagrams/generated/module_dependencies.mmd")
        print("  - docs/diagrams/generated/entity_relationships.mmd")
        print("  - docs/diagrams/generated/workflow_dependencies.mmd")
        return 0
    elif total_errors == 0:
        print(f"⚠️  Specification checks passed with {total_warnings} warnings")
        return 0
    else:
        print(f"❌ Specification checks failed with {total_errors} errors")
        return 1


if __name__ == "__main__":
    sys.exit(main())