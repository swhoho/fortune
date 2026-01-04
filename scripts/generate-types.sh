#!/bin/bash
# Python Code-First 타입 생성 스크립트
# Pydantic → OpenAPI → TypeScript 자동 변환
#
# 사용법: npm run generate:types

set -e

echo "🐍 Step 1: Python OpenAPI 스키마 내보내기..."
cd python

# 가상환경 활성화 (있는 경우)
if [ -d "venv" ]; then
    source venv/bin/activate
fi

python3 export_openapi.py
cd ..

echo "📝 Step 2: TypeScript 타입 생성..."
npx openapi-typescript src/types/openapi.json -o src/types/generated.d.ts

echo "✅ 타입 생성 완료!"
echo "   - OpenAPI: src/types/openapi.json"
echo "   - TypeScript: src/types/generated.d.ts"
