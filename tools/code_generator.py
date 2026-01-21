#!/usr/bin/env python3
"""
Code Generator Tool for oinkerui Project

This tool deterministically generates code scaffolding from specification files.
It creates module files, data structures, function signatures, and comments with
spec references and FOL algorithm descriptions.

Key Features:
- Language-aware code generation (Node.js/JavaScript, Python)
- Generates module structure from spec/modules/*.yaml
- Generates function signatures from spec/functions/*/*.yaml
- Includes FOL algorithm comments
- Adds spec reference comments (doc_query references)
- Extensible for additional languages

Usage:
    python3 tools/code_generator.py --module backend_node --output backend/src
    python3 tools/code_generator.py --function backend_node.create_project --output backend/src
    python3 tools/code_generator.py --all --output .
"""

import argparse
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
import yaml
import re

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from yaml_db import YAMLDatabase


class LanguageGenerator:
    """Base class for language-specific code generators."""
    
    def __init__(self, language: str):
        self.language = language
    
    def generate_module_header(self, module_spec: Dict[str, Any]) -> str:
        """Generate module header comment."""
        raise NotImplementedError
    
    def generate_imports(self, dependencies: List[str]) -> str:
        """Generate import statements."""
        raise NotImplementedError
    
    def generate_data_structure(self, name: str, fields: Dict[str, Any]) -> str:
        """Generate data structure definition."""
        raise NotImplementedError
    
    def generate_function_signature(self, func_spec: Dict[str, Any]) -> str:
        """Generate function signature with documentation."""
        raise NotImplementedError
    
    def generate_error_class(self, name: str, description: str) -> str:
        """Generate error/exception class."""
        raise NotImplementedError
    
    def get_file_extension(self) -> str:
        """Get file extension for this language."""
        raise NotImplementedError


class JavaScriptGenerator(LanguageGenerator):
    """JavaScript/Node.js code generator."""
    
    def __init__(self):
        super().__init__("javascript")
    
    def generate_module_header(self, module_spec: Dict[str, Any]) -> str:
        """Generate module header comment."""
        module = module_spec.get('module', {})
        lines = [
            "/**",
            f" * @module {module.get('id', 'unknown')}",
            f" * @version {module.get('version', '1.0.0')}",
            " *",
            f" * {module.get('name', 'Unknown Module')}",
            " *",
        ]
        
        # Add description
        description = module.get('description', '')
        if description:
            for line in description.strip().split('\n'):
                lines.append(f" * {line.strip()}")
        
        lines.append(" *")
        
        # Add responsibilities
        responsibilities = module.get('responsibilities', [])
        if responsibilities:
            lines.append(" * Responsibilities:")
            for resp in responsibilities:
                lines.append(f" *   - {resp}")
        
        lines.append(" *")
        lines.append(f" * @see spec/modules/{module.get('id', 'unknown')}.yaml")
        lines.append(f" * @generated {datetime.now().isoformat()}")
        lines.append(" */")
        lines.append("")
        lines.append("'use strict';")
        lines.append("")
        
        return '\n'.join(lines)
    
    def generate_imports(self, dependencies: List[Dict[str, Any]]) -> str:
        """Generate import statements."""
        lines = []
        
        # Group by type
        npm_deps = []
        local_deps = []
        
        for dep in dependencies:
            if isinstance(dep, dict):
                name = dep.get('name', dep.get('package', ''))
                version = dep.get('version', '')
                if name:
                    npm_deps.append((name, version))
            elif isinstance(dep, str):
                if dep.startswith('./') or dep.startswith('../'):
                    local_deps.append(dep)
                else:
                    npm_deps.append((dep, ''))
        
        # NPM dependencies
        if npm_deps:
            lines.append("// External dependencies")
            for name, version in npm_deps:
                # Convert package name to variable name
                var_name = name.replace('@', '').replace('/', '_').replace('-', '_')
                if '/' in name:
                    var_name = name.split('/')[-1].replace('-', '_')
                lines.append(f"const {var_name} = require('{name}');")
            lines.append("")
        
        # Local dependencies
        if local_deps:
            lines.append("// Local dependencies")
            for dep in local_deps:
                var_name = Path(dep).stem.replace('-', '_')
                lines.append(f"const {var_name} = require('{dep}');")
            lines.append("")
        
        return '\n'.join(lines)
    
    def generate_data_structure(self, name: str, fields: Dict[str, Any], description: str = "") -> str:
        """Generate JSDoc typedef for data structure."""
        lines = [
            "/**",
            f" * @typedef {{{name}}} {name}",
        ]
        
        if description:
            lines.append(f" * @description {description}")
        
        for field_name, field_info in fields.items():
            if isinstance(field_info, dict):
                field_type = field_info.get('type', 'any')
                field_desc = field_info.get('description', '')
                required = field_info.get('required', True)
                
                # Convert type to JSDoc type
                js_type = self._convert_type(field_type)
                
                if required:
                    lines.append(f" * @property {{{js_type}}} {field_name} - {field_desc}")
                else:
                    lines.append(f" * @property {{{js_type}}} [{field_name}] - {field_desc}")
            else:
                lines.append(f" * @property {{*}} {field_name}")
        
        lines.append(" */")
        lines.append("")
        
        return '\n'.join(lines)
    
    def generate_function_signature(self, func_spec: Dict[str, Any]) -> str:
        """Generate function signature with JSDoc and FOL comments."""
        func = func_spec.get('function', {})
        lines = []
        
        # JSDoc comment
        lines.append("/**")
        lines.append(f" * {func.get('name', 'unknown')}")
        lines.append(" *")
        
        # Purpose
        purpose = func.get('purpose', '')
        if purpose:
            for line in purpose.strip().split('\n'):
                lines.append(f" * {line.strip()}")
        
        lines.append(" *")
        
        # Parameters
        signature = func.get('signature', {})
        params = signature.get('parameters', [])
        for param in params:
            param_name = param.get('name', 'unknown')
            param_type = self._convert_type(param.get('type', 'any'))
            param_desc = param.get('description', '')
            required = param.get('required', True)
            
            if required:
                lines.append(f" * @param {{{param_type}}} {param_name} - {param_desc}")
            else:
                default = param.get('default', 'undefined')
                lines.append(f" * @param {{{param_type}}} [{param_name}={default}] - {param_desc}")
        
        # Returns
        returns = signature.get('returns', {})
        if returns:
            ret_type = self._convert_type(returns.get('type', 'void'))
            ret_desc = returns.get('description', '')
            lines.append(f" * @returns {{Promise<{ret_type}>}} {ret_desc}")
        
        # Throws
        throws = signature.get('throws', [])
        for throw in throws:
            throw_type = throw.get('type', 'Error')
            throw_desc = throw.get('description', '')
            lines.append(f" * @throws {{{throw_type}}} {throw_desc}")
        
        lines.append(" *")
        
        # Contract (preconditions, postconditions)
        contract = func.get('contract', {})
        preconditions = contract.get('preconditions', [])
        if preconditions:
            lines.append(" * @preconditions")
            for pre in preconditions:
                lines.append(f" *   - {pre}")
        
        postconditions = contract.get('postconditions', [])
        if postconditions:
            lines.append(" * @postconditions")
            for post in postconditions:
                lines.append(f" *   - {post}")
        
        lines.append(" *")
        
        # FOL specification
        algorithm = func.get('algorithm', {})
        fol_spec = algorithm.get('fol_specification', '')
        if fol_spec:
            lines.append(" * @fol_specification")
            for line in fol_spec.strip().split('\n'):
                lines.append(f" *   {line.strip()}")
        
        lines.append(" *")
        
        # Spec reference
        func_id = func.get('id', 'unknown')
        module_id = func.get('module', 'unknown')
        lines.append(f" * @see spec/functions/{module_id}/{func_id.split('.')[-1]}.yaml")
        lines.append(f" * @query python3 tools/doc_query.py --query &quot;{func_id}&quot; --mode text --pretty")
        lines.append(" */")
        
        # Function signature
        param_list = ', '.join([
            f"{p.get('name', 'arg')}" + (f" = {self._default_value(p.get('default'))}" if not p.get('required', True) else "")
            for p in params
        ])
        
        lines.append(f"async function {func.get('name', 'unknown')}({param_list}) {{")
        
        # Algorithm steps as comments
        steps = algorithm.get('steps', [])
        if steps:
            lines.append("  // Algorithm steps:")
            for step in steps:
                step_num = step.get('step', '?')
                action = step.get('action', '')
                rationale = step.get('rationale', '')
                lines.append(f"  // Step {step_num}: {action}")
                if rationale:
                    lines.append(f"  //   Rationale: {rationale}")
        
        lines.append("")
        lines.append("  // TODO: Implement according to spec")
        lines.append("  throw new Error('Not implemented');")
        lines.append("}")
        lines.append("")
        
        return '\n'.join(lines)
    
    def generate_error_class(self, name: str, description: str) -> str:
        """Generate custom error class."""
        lines = [
            "/**",
            f" * {name}",
            f" * @description {description}",
            " */",
            f"class {name} extends Error {{",
            "  constructor(message, details = {}) {",
            "    super(message);",
            f"    this.name = '{name}';",
            "    this.details = details;",
            "  }",
            "}",
            ""
        ]
        return '\n'.join(lines)
    
    def generate_exports(self, exports: List[str]) -> str:
        """Generate module exports."""
        lines = ["module.exports = {"]
        for exp in exports:
            lines.append(f"  {exp},")
        lines.append("};")
        return '\n'.join(lines)
    
    def _convert_type(self, spec_type: str) -> str:
        """Convert spec type to JavaScript type."""
        type_map = {
            'string': 'string',
            'number': 'number',
            'integer': 'number',
            'boolean': 'boolean',
            'object': 'Object',
            'array': 'Array',
            'any': '*',
            'void': 'void',
            'null': 'null',
            'undefined': 'undefined',
            'uuid': 'string',
            'datetime': 'string',
            'date': 'string',
        }
        return type_map.get(spec_type.lower(), spec_type)
    
    def _default_value(self, value: Any) -> str:
        """Convert default value to JavaScript literal."""
        if value is None:
            return 'null'
        if isinstance(value, bool):
            return 'true' if value else 'false'
        if isinstance(value, str):
            return f"'{value}'"
        if isinstance(value, dict):
            return '{}'
        if isinstance(value, list):
            return '[]'
        return str(value)
    
    def get_file_extension(self) -> str:
        return '.js'


class PythonGenerator(LanguageGenerator):
    """Python code generator."""
    
    def __init__(self):
        super().__init__("python")
    
    def generate_module_header(self, module_spec: Dict[str, Any]) -> str:
        """Generate module header docstring."""
        module = module_spec.get('module', {})
        lines = [
            '"""',
            f"{module.get('name', 'Unknown Module')}",
            "",
        ]
        
        # Add description
        description = module.get('description', '')
        if description:
            for line in description.strip().split('\n'):
                lines.append(line.strip())
        
        lines.append("")
        
        # Add responsibilities
        responsibilities = module.get('responsibilities', [])
        if responsibilities:
            lines.append("Responsibilities:")
            for resp in responsibilities:
                lines.append(f"    - {resp}")
        
        lines.append("")
        lines.append(f"See: spec/modules/{module.get('id', 'unknown')}.yaml")
        lines.append(f"Generated: {datetime.now().isoformat()}")
        lines.append('"""')
        lines.append("")
        
        return '\n'.join(lines)
    
    def generate_imports(self, dependencies: List[Dict[str, Any]]) -> str:
        """Generate import statements."""
        lines = []
        
        # Standard library
        std_libs = ['os', 'sys', 'json', 'logging', 'asyncio', 'uuid', 'datetime']
        used_std = []
        
        # Third-party
        third_party = []
        
        for dep in dependencies:
            if isinstance(dep, dict):
                name = dep.get('name', dep.get('package', ''))
                if name in std_libs:
                    used_std.append(name)
                elif name:
                    third_party.append(name)
            elif isinstance(dep, str):
                if dep in std_libs:
                    used_std.append(dep)
                else:
                    third_party.append(dep)
        
        # Standard library imports
        if used_std:
            for lib in sorted(set(used_std)):
                lines.append(f"import {lib}")
            lines.append("")
        
        # Third-party imports
        if third_party:
            lines.append("# Third-party dependencies")
            for lib in sorted(set(third_party)):
                # Convert package name to import name
                import_name = lib.replace('-', '_')
                lines.append(f"import {import_name}")
            lines.append("")
        
        return '\n'.join(lines)
    
    def generate_data_structure(self, name: str, fields: Dict[str, Any], description: str = "") -> str:
        """Generate dataclass or TypedDict."""
        lines = [
            "@dataclass",
            f"class {name}:",
            f'    """{description}"""' if description else f'    """Data class for {name}."""',
            ""
        ]
        
        for field_name, field_info in fields.items():
            if isinstance(field_info, dict):
                field_type = self._convert_type(field_info.get('type', 'Any'))
                field_desc = field_info.get('description', '')
                required = field_info.get('required', True)
                default = field_info.get('default')
                
                if required:
                    lines.append(f"    {field_name}: {field_type}  # {field_desc}")
                else:
                    default_val = self._default_value(default)
                    lines.append(f"    {field_name}: Optional[{field_type}] = {default_val}  # {field_desc}")
            else:
                lines.append(f"    {field_name}: Any")
        
        lines.append("")
        return '\n'.join(lines)
    
    def generate_function_signature(self, func_spec: Dict[str, Any]) -> str:
        """Generate function signature with docstring and FOL comments."""
        func = func_spec.get('function', {})
        lines = []
        
        # Build parameter list
        signature = func.get('signature', {})
        params = signature.get('parameters', [])
        param_strs = []
        
        for param in params:
            param_name = param.get('name', 'arg')
            param_type = self._convert_type(param.get('type', 'Any'))
            required = param.get('required', True)
            default = param.get('default')
            
            if required:
                param_strs.append(f"{param_name}: {param_type}")
            else:
                default_val = self._default_value(default)
                param_strs.append(f"{param_name}: Optional[{param_type}] = {default_val}")
        
        # Return type
        returns = signature.get('returns', {})
        ret_type = self._convert_type(returns.get('type', 'None'))
        
        # Function definition
        param_list = ', '.join(param_strs)
        lines.append(f"async def {func.get('name', 'unknown')}({param_list}) -> {ret_type}:")
        
        # Docstring
        lines.append('    """')
        lines.append(f"    {func.get('name', 'unknown')}")
        lines.append("")
        
        # Purpose
        purpose = func.get('purpose', '')
        if purpose:
            for line in purpose.strip().split('\n'):
                lines.append(f"    {line.strip()}")
        
        lines.append("")
        
        # Args
        if params:
            lines.append("    Args:")
            for param in params:
                param_name = param.get('name', 'unknown')
                param_desc = param.get('description', '')
                lines.append(f"        {param_name}: {param_desc}")
        
        lines.append("")
        
        # Returns
        if returns:
            ret_desc = returns.get('description', '')
            lines.append("    Returns:")
            lines.append(f"        {ret_desc}")
        
        lines.append("")
        
        # Raises
        throws = signature.get('throws', [])
        if throws:
            lines.append("    Raises:")
            for throw in throws:
                throw_type = throw.get('type', 'Exception')
                throw_desc = throw.get('description', '')
                lines.append(f"        {throw_type}: {throw_desc}")
        
        lines.append("")
        
        # Contract
        contract = func.get('contract', {})
        preconditions = contract.get('preconditions', [])
        if preconditions:
            lines.append("    Preconditions:")
            for pre in preconditions:
                lines.append(f"        - {pre}")
        
        postconditions = contract.get('postconditions', [])
        if postconditions:
            lines.append("    Postconditions:")
            for post in postconditions:
                lines.append(f"        - {post}")
        
        lines.append("")
        
        # FOL specification
        algorithm = func.get('algorithm', {})
        fol_spec = algorithm.get('fol_specification', '')
        if fol_spec:
            lines.append("    FOL Specification:")
            for line in fol_spec.strip().split('\n'):
                lines.append(f"        {line.strip()}")
        
        lines.append("")
        
        # Spec reference
        func_id = func.get('id', 'unknown')
        module_id = func.get('module', 'unknown')
        lines.append(f"    See: spec/functions/{module_id}/{func_id.split('.')[-1]}.yaml")
        lines.append(f"    Query: python3 tools/doc_query.py --query &quot;{func_id}&quot; --mode text --pretty")
        lines.append('    """')
        
        # Algorithm steps as comments
        steps = algorithm.get('steps', [])
        if steps:
            lines.append("    # Algorithm steps:")
            for step in steps:
                step_num = step.get('step', '?')
                action = step.get('action', '')
                rationale = step.get('rationale', '')
                lines.append(f"    # Step {step_num}: {action}")
                if rationale:
                    lines.append(f"    #   Rationale: {rationale}")
        
        lines.append("")
        lines.append("    # TODO: Implement according to spec")
        lines.append("    raise NotImplementedError()")
        lines.append("")
        
        return '\n'.join(lines)
    
    def generate_error_class(self, name: str, description: str) -> str:
        """Generate custom exception class."""
        lines = [
            f"class {name}(Exception):",
            f'    """{description}"""',
            "",
            "    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):",
            "        super().__init__(message)",
            "        self.details = details or {}",
            ""
        ]
        return '\n'.join(lines)
    
    def _convert_type(self, spec_type: str) -> str:
        """Convert spec type to Python type."""
        type_map = {
            'string': 'str',
            'number': 'float',
            'integer': 'int',
            'boolean': 'bool',
            'object': 'Dict[str, Any]',
            'array': 'List[Any]',
            'any': 'Any',
            'void': 'None',
            'null': 'None',
            'uuid': 'str',
            'datetime': 'str',
            'date': 'str',
        }
        return type_map.get(spec_type.lower(), spec_type)
    
    def _default_value(self, value: Any) -> str:
        """Convert default value to Python literal."""
        if value is None:
            return 'None'
        if isinstance(value, bool):
            return 'True' if value else 'False'
        if isinstance(value, str):
            return f"'{value}'"
        if isinstance(value, dict):
            return '{}'
        if isinstance(value, list):
            return '[]'
        return str(value)
    
    def get_file_extension(self) -> str:
        return '.py'


class CodeGenerator:
    """Main code generator that orchestrates language-specific generators."""
    
    # Module to language mapping
    MODULE_LANGUAGES = {
        'backend_node': 'javascript',
        'frontend_svelte': 'javascript',
        'backend_python_tools': 'python',
        'git_integration': 'javascript',  # Part of Node backend
        'logging_and_metrics': 'javascript',  # Part of Node backend
    }
    
    def __init__(self, project_root: Union[str, Path]):
        self.project_root = Path(project_root)
        self.generators = {
            'javascript': JavaScriptGenerator(),
            'python': PythonGenerator(),
        }
    
    def get_language_for_module(self, module_id: str) -> str:
        """Get the target language for a module."""
        return self.MODULE_LANGUAGES.get(module_id, 'javascript')
    
    def load_module_spec(self, module_id: str) -> Optional[Dict[str, Any]]:
        """Load a module specification."""
        spec_path = self.project_root / "spec" / "modules" / f"{module_id}.yaml"
        if not spec_path.exists():
            print(f"Error: Module spec not found: {spec_path}")
            return None
        
        db = YAMLDatabase(spec_path, create_backup=False)
        return db.load()
    
    def load_function_spec(self, func_id: str) -> Optional[Dict[str, Any]]:
        """Load a function specification."""
        # func_id format: module_id.function_name
        parts = func_id.split('.')
        if len(parts) != 2:
            print(f"Error: Invalid function ID format: {func_id}")
            return None
        
        module_id, func_name = parts
        spec_path = self.project_root / "spec" / "functions" / module_id / f"{func_name}.yaml"
        
        if not spec_path.exists():
            print(f"Error: Function spec not found: {spec_path}")
            return None
        
        db = YAMLDatabase(spec_path, create_backup=False)
        return db.load()
    
    def list_module_functions(self, module_id: str) -> List[str]:
        """List all functions for a module."""
        func_dir = self.project_root / "spec" / "functions" / module_id
        if not func_dir.exists():
            return []
        
        return [f.stem for f in func_dir.glob("*.yaml")]
    
    def generate_module(self, module_id: str, output_dir: Optional[Path] = None) -> Optional[str]:
        """Generate code for a module."""
        module_spec = self.load_module_spec(module_id)
        if not module_spec:
            return None
        
        language = self.get_language_for_module(module_id)
        generator = self.generators.get(language)
        if not generator:
            print(f"Error: No generator for language: {language}")
            return None
        
        # Generate code
        code_parts = []
        
        # Header
        code_parts.append(generator.generate_module_header(module_spec))
        
        # Imports
        module = module_spec.get('module', {})
        deps = module.get('dependencies', {})
        external_deps = deps.get('external', [])
        if external_deps:
            code_parts.append(generator.generate_imports(external_deps))
        
        # Error classes
        if language == 'javascript':
            code_parts.append("// Custom error classes")
            code_parts.append(generator.generate_error_class("ValidationError", "Input validation failed"))
            code_parts.append(generator.generate_error_class("ConflictError", "Resource conflict"))
            code_parts.append(generator.generate_error_class("NotFoundError", "Resource not found"))
            code_parts.append(generator.generate_error_class("FileSystemError", "File system operation failed"))
            code_parts.append(generator.generate_error_class("GitError", "Git operation failed"))
        elif language == 'python':
            code_parts.append("# Custom exception classes")
            code_parts.append("from dataclasses import dataclass")
            code_parts.append("from typing import Dict, List, Any, Optional")
            code_parts.append("")
            code_parts.append(generator.generate_error_class("ValidationError", "Input validation failed"))
            code_parts.append(generator.generate_error_class("ConflictError", "Resource conflict"))
            code_parts.append(generator.generate_error_class("NotFoundError", "Resource not found"))
        
        # Functions
        functions = self.list_module_functions(module_id)
        if functions:
            code_parts.append(f"// Functions ({len(functions)} total)" if language == 'javascript' else f"# Functions ({len(functions)} total)")
            code_parts.append("")
            
            exports = []
            for func_name in functions:
                func_spec = self.load_function_spec(f"{module_id}.{func_name}")
                if func_spec:
                    code_parts.append(generator.generate_function_signature(func_spec))
                    exports.append(func_spec.get('function', {}).get('name', func_name))
            
            # Exports (JavaScript only)
            if language == 'javascript':
                code_parts.append(generator.generate_exports(exports))
        
        code = '\n'.join(code_parts)
        
        # Write to file if output_dir specified
        if output_dir:
            output_path = output_dir / f"{module_id}{generator.get_file_extension()}"
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'w') as f:
                f.write(code)
            print(f"✓ Generated: {output_path}")
        
        return code
    
    def generate_function(self, func_id: str, output_dir: Optional[Path] = None) -> Optional[str]:
        """Generate code for a single function."""
        func_spec = self.load_function_spec(func_id)
        if not func_spec:
            return None
        
        module_id = func_spec.get('function', {}).get('module', '')
        language = self.get_language_for_module(module_id)
        generator = self.generators.get(language)
        
        if not generator:
            print(f"Error: No generator for language: {language}")
            return None
        
        code = generator.generate_function_signature(func_spec)
        
        # Write to file if output_dir specified
        if output_dir:
            func_name = func_spec.get('function', {}).get('name', func_id.split('.')[-1])
            output_path = output_dir / f"{func_name}{generator.get_file_extension()}"
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'w') as f:
                f.write(code)
            print(f"✓ Generated: {output_path}")
        
        return code
    
    def generate_all(self, output_dir: Path) -> bool:
        """Generate code for all modules."""
        success = True
        
        modules_dir = self.project_root / "spec" / "modules"
        if not modules_dir.exists():
            print(f"Error: Modules directory not found: {modules_dir}")
            return False
        
        for module_file in modules_dir.glob("*.yaml"):
            module_id = module_file.stem
            print(f"\nGenerating module: {module_id}")
            
            # Determine output subdirectory based on language
            language = self.get_language_for_module(module_id)
            if language == 'javascript':
                if module_id == 'frontend_svelte':
                    sub_dir = output_dir / "frontend" / "src" / "lib"
                else:
                    sub_dir = output_dir / "backend" / "src"
            else:
                sub_dir = output_dir / "backend_python" / "src"
            
            if not self.generate_module(module_id, sub_dir):
                success = False
        
        return success


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='Generate code from specifications')
    parser.add_argument('--project-root', default='.', help='Project root directory')
    parser.add_argument('--module', help='Module ID to generate')
    parser.add_argument('--function', help='Function ID to generate (format: module.function)')
    parser.add_argument('--all', action='store_true', help='Generate all modules')
    parser.add_argument('--output', help='Output directory')
    parser.add_argument('--preview', action='store_true', help='Preview generated code without writing')
    
    args = parser.parse_args()
    
    generator = CodeGenerator(args.project_root)
    
    output_dir = Path(args.output) if args.output else None
    
    if args.all:
        if not output_dir:
            print("Error: --output required with --all")
            sys.exit(1)
        success = generator.generate_all(output_dir)
        sys.exit(0 if success else 1)
    
    elif args.module:
        code = generator.generate_module(args.module, output_dir if not args.preview else None)
        if code:
            if args.preview:
                print(code)
            print(f"\n✓ Module {args.module} generated successfully")
        else:
            sys.exit(1)
    
    elif args.function:
        code = generator.generate_function(args.function, output_dir if not args.preview else None)
        if code:
            if args.preview:
                print(code)
            print(f"\n✓ Function {args.function} generated successfully")
        else:
            sys.exit(1)
    
    else:
        parser.print_help()


if __name__ == "__main__":
    main()