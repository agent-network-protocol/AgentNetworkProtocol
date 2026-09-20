#!/usr/bin/env python3
import os
import sys

def is_chinese_file(filepath):
    # Check if file is in chinese directory or has cn in name
    return 'chinese' in filepath or 'cn' in filepath.lower()

def add_copyright_notice(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Skip if copyright notice already exists
        if '版权声明' in content or 'Copyright Notice' in content:
            return
            
        # Prepare copyright notice based on language
        if is_chinese_file(filepath):
            copyright_notice = """
## 版权声明  
Copyright (c) 2024 GaoWei Chang  
本文件依据 [Apache License 2.0](./LICENSE) 发布，您可以自由使用和修改，但必须保留本版权声明。
"""
        else:
            copyright_notice = """
## Copyright Notice
Copyright (c) 2024 GaoWei Chang  
This file is released under the [Apache License 2.0](./LICENSE). You are free to use and modify it, but you must retain this copyright notice.
"""
        
        # Add copyright notice to the end of file
        with open(filepath, 'a', encoding='utf-8') as f:
            f.write(copyright_notice)
            
        print(f"Added copyright notice to {filepath}")
            
    except Exception as e:
        print(f"Error processing {filepath}: {str(e)}")

def main():
    # Walk through all directories
    for root, dirs, files in os.walk('.'):
        # Skip venv directory
        if 'venv' in root:
            continue
            
        for file in files:
            if file.endswith('.md'):
                filepath = os.path.join(root, file)
                add_copyright_notice(filepath)

if __name__ == '__main__':
    main()
