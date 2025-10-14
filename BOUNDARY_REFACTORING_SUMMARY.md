# Boundary Logic Refactoring Summary

## 문제점 분석

### 발견된 문제들:
1. **Shape.tsx**: `dragBoundFunc`가 shape dimensions 변경 시 업데이트되지 않음
   - Resize 후 circle의 radius나 rectangle의 width/height가 변경되면 boundary 함수도 업데이트되어야 하는데 그렇지 않았음
   
2. **Canvas.tsx**: Shape 생성 시 boundary constraint가 적용되지 않음
   - Rectangle, Circle, Text 생성 시 경계 밖으로 나갈 수 있었음
   - Preview shape도 boundary constraint 없이 렌더링되었음

## 해결 방법 (Konva Best Practices)

### 1. Shape.tsx 개선
```typescript
// useMemo를 사용해서 shape dimensions 변경 시 dragBoundFunc 재계산
const dragBoundFunc = useMemo(() => {
  return getShapeDragBoundFunc(shape);
}, [
  shape.type,
  shape.type === 'rectangle' ? (shape as RectangleShape).width : 0,
  shape.type === 'rectangle' ? (shape as RectangleShape).height : 0,
  shape.type === 'circle' ? (shape as CircleShape).radius : 0,
  shape.type === 'text' ? (shape as TextShape).fontSize : 0,
]);
```

**장점:**
- Shape resize 후에도 올바른 boundary constraint 적용
- 필요한 경우에만 재계산 (성능 최적화)
- Type-safe한 dependency 체크

### 2. Canvas.tsx Shape 생성 로직 개선

#### Rectangle 생성:
```typescript
// Raw values 계산
const rawX = width > 0 ? startPoint.x : pointer.x;
const rawY = height > 0 ? startPoint.y : pointer.y;
const rawWidth = Math.abs(width);
const rawHeight = Math.abs(height);

// Boundary constraint 적용
const constrained = constrainShapeCreation('rectangle', rawX, rawY, rawWidth, rawHeight);

// Constrained values로 shape 생성
const newShape: RectangleShape = {
  ...
  x: constrained.x,
  y: constrained.y,
  width: constrained.width ?? rawWidth,
  height: constrained.height ?? rawHeight,
  ...
};
```

#### Circle 생성:
```typescript
// Raw values 계산
const dx = pointer.x - startPoint.x;
const dy = pointer.y - startPoint.y;
const radius = Math.sqrt(dx * dx + dy * dy);

// Boundary constraint 적용
const constrained = constrainShapeCreation('circle', startPoint.x, startPoint.y, undefined, undefined, radius);

// Constrained values로 shape 생성
const newShape: CircleShape = {
  ...
  x: constrained.x,
  y: constrained.y,
  radius: constrained.radius ?? radius,
  ...
};
```

#### Text 생성:
```typescript
// Raw values 계산
const rawCanvasX = (textEditPosition.x - viewport.x) / viewport.scale;
const rawCanvasY = (textEditPosition.y - viewport.y) / viewport.scale;

// Boundary constraint 적용
const constrained = constrainPoint(rawCanvasX, rawCanvasY);

// Constrained values로 shape 생성
const newShape: TextShape = {
  ...
  x: constrained.x,
  y: constrained.y,
  ...
};
```

### 3. Preview Shape에도 동일한 Constraint 적용
Preview rendering 시에도 동일한 `constrainShapeCreation` 함수 사용하여 일관성 유지

## 최종 아키텍처

### Konva Framework의 Built-in Methods 활용:

1. **`dragBoundFunc`** (Shape level)
   - 각 shape의 dragging을 제한
   - Shape component에서 자동으로 적용
   - Shape dimensions에 맞춰 동적으로 업데이트

2. **`boundBoxFunc`** (Transformer level)
   - Transformer의 resize 작업을 제한
   - Canvas component의 Transformer에서 적용
   - 모든 shape type에 일관되게 작동

3. **Centralized Boundary Logic** (`boundaries.ts`)
   - 모든 boundary 계산 로직을 한 곳에 집중
   - Rectangle, Circle, Text 각각에 최적화된 constraint 함수
   - Shape 생성, 이동, 리사이즈 모두 동일한 로직 사용

## 테스트 결과

✅ **모든 71개 테스트 통과**
- 기존 52개 테스트 + 19개 새로운 boundary 테스트
- Rectangle, Circle, Text 모두 정상 작동 확인
- Boundary constraint가 모든 경우에 올바르게 적용됨

## 파일 변경 사항

### 생성된 파일:
- `src/utils/boundaries.ts` - Centralized boundary logic
- `src/utils/boundaries.test.ts` - 19 comprehensive unit tests

### 수정된 파일:
- `src/components/Canvas/Shape.tsx` - useMemo로 dragBoundFunc 동적 업데이트
- `src/components/Canvas/Canvas.tsx` - Shape 생성 시 boundary constraint 적용

## Best Practices 준수

1. ✅ **Konva 공식 문서 패턴 따름**
   - `dragBoundFunc` 사용 (shape dragging)
   - `boundBoxFunc` 사용 (transformer resize)

2. ✅ **코드 중복 제거**
   - 3곳에 흩어진 boundary 로직 → 1개 모듈로 통합

3. ✅ **Type Safety**
   - TypeScript type guards 사용
   - 각 shape type별 명확한 타입 정의

4. ✅ **성능 최적화**
   - useMemo로 불필요한 재계산 방지
   - Dependency array를 최소화

5. ✅ **일관성**
   - Rectangle, Circle, Text 모두 동일한 패턴 적용
   - Creation, Preview, Drag, Resize 모두 동일한 constraint 로직 사용

## 결론

이제 **Circle과 Text가 정상 작동**하며, 모든 shape type에 대해 **일관되고 견고한 boundary constraint**가 적용됩니다. Konva framework의 best practices를 따라 **깔끔하고 유지보수 가능한 코드**를 구현했습니다.

