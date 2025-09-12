#!/usr/bin/env python3
"""
JSON Event File Validator
Checks if a JSON file is properly formatted for use with fetch('events.json')
"""

import json
import sys
from datetime import datetime
from typing import List, Dict, Any, Tuple
import re

def validate_json_file(filename: str) -> Tuple[bool, List[str]]:
    """
    Validate a JSON file for proper format to be used with fetch()
    
    Returns:
        Tuple of (is_valid, list_of_issues)
    """
    issues = []
    
    try:
        # Step 1: Check if file can be opened and read
        with open(filename, 'r', encoding='utf-8') as file:
            content = file.read()
            
        # Step 2: Check if it's valid JSON
        try:
            data = json.loads(content)
        except json.JSONDecodeError as e:
            issues.append(f"❌ Invalid JSON syntax: {e}")
            return False, issues
            
        # Step 3: Check if it's an array (expected format for event lists)
        if not isinstance(data, list):
            issues.append(f"❌ Root element should be an array, got {type(data).__name__}")
            return False, issues
            
        # Step 4: Validate each event object
        required_fields = {'title', 'date', 'location', 'link'}
        url_pattern = re.compile(r'^https?://')
        
        for index, event in enumerate(data):
            # Check if item is an object
            if not isinstance(event, dict):
                issues.append(f"❌ Item {index}: Should be an object, got {type(event).__name__}")
                continue
                
            # Check for required fields
            missing_fields = required_fields - set(event.keys())
            if missing_fields:
                issues.append(f"❌ Item {index}: Missing required fields: {missing_fields}")
                
            # Check for extra fields (warning only)
            extra_fields = set(event.keys()) - required_fields
            if extra_fields:
                issues.append(f"⚠️  Item {index}: Contains extra fields: {extra_fields}")
                
            # Validate field types and content
            if 'title' in event:
                if not isinstance(event['title'], str):
                    issues.append(f"❌ Item {index}: Title should be a string")
                elif url_pattern.match(event['title']):
                    issues.append(f"❌ Item {index}: Title contains a URL instead of text: '{event['title'][:50]}...'")
                elif len(event['title'].strip()) == 0:
                    issues.append(f"❌ Item {index}: Title is empty")
                    
            if 'date' in event:
                if not isinstance(event['date'], str):
                    issues.append(f"❌ Item {index}: Date should be a string")
                else:
                    # Try to parse ISO 8601 date format
                    try:
                        datetime.fromisoformat(event['date'].replace('Z', '+00:00'))
                    except ValueError:
                        issues.append(f"❌ Item {index}: Invalid date format '{event['date']}' (expected ISO 8601)")
                        
            if 'location' in event:
                if not isinstance(event['location'], str):
                    issues.append(f"❌ Item {index}: Location should be a string")
                elif len(event['location'].strip()) == 0:
                    issues.append(f"⚠️  Item {index}: Location is empty")
                    
            if 'link' in event:
                if not isinstance(event['link'], str):
                    issues.append(f"❌ Item {index}: Link should be a string")
                elif not url_pattern.match(event['link']):
                    issues.append(f"❌ Item {index}: Link doesn't appear to be a valid URL: '{event['link']}'")
                    
        # Step 5: Check for duplicate events (warning only)
        seen_events = set()
        for index, event in enumerate(data):
            if isinstance(event, dict):
                event_key = (event.get('title', ''), event.get('date', ''))
                if event_key in seen_events and event_key != ('', ''):
                    issues.append(f"⚠️  Item {index}: Duplicate event (same title and date)")
                seen_events.add(event_key)
                
        # Determine if file is valid for fetch()
        critical_issues = [issue for issue in issues if issue.startswith('❌')]
        is_valid = len(critical_issues) == 0
        
        return is_valid, issues
        
    except FileNotFoundError:
        issues.append(f"❌ File '{filename}' not found")
        return False, issues
    except Exception as e:
        issues.append(f"❌ Unexpected error: {e}")
        return False, issues


def main():
    """Main function to run the validator"""
    
    # Default filename
    filename = 'events.json'
    
    # Check if filename was provided as argument
    if len(sys.argv) > 1:
        filename = sys.argv[1]
    
    print(f"🔍 Validating JSON file: {filename}")
    print("=" * 60)
    
    is_valid, issues = validate_json_file(filename)
    
    if issues:
        print("\n📋 Issues found:")
        for issue in issues:
            print(f"  {issue}")
    else:
        print("\n✅ No issues found!")
        
    print("\n" + "=" * 60)
    
    if is_valid:
        print("✅ File is VALID for use with fetch()")
        print("   The JSON structure is correct and can be fetched and parsed.")
    else:
        print("❌ File is NOT VALID for use with fetch()")
        print("   Fix the critical issues (❌) before using with fetch().")
        
    # Return exit code for scripting
    sys.exit(0 if is_valid else 1)


if __name__ == "__main__":
    main()