# REST API Development Examples

This directory contains examples demonstrating different approaches to building REST API endpoints in MikoPBX modules.

## Available Examples

### [ModuleExampleRestAPIv1](ModuleExampleRestAPIv1/) - Pattern 1: Simple Callback
**Status**: ✅ Production-ready, legacy pattern

The simplest approach using a single callback method for all API requests.

**Pros**:
- Minimal code
- Easy to understand
- Good for simple modules with 1-2 endpoints

**Cons**:
- No automatic OpenAPI documentation
- Manual routing logic
- Harder to maintain with many endpoints

**Use when**: You have a simple module with just a few API endpoints

---

### [ModuleExampleRestAPIv2](ModuleExampleRestAPIv2/) - Pattern 2: Custom Controllers
**Status**: ✅ Production-ready, transitional pattern

Intermediate approach with custom controllers but manual routing.

**Pros**:
- Better code organization than v1
- Separation of concerns
- Reusable controllers

**Cons**:
- Still requires manual route registration
- No automatic OpenAPI spec generation
- More boilerplate than v3

**Use when**: Migrating from v1 to v3, or need custom routing logic

---

### [ModuleExampleRestAPIv3](ModuleExampleRestAPIv3/) - Pattern 3: Modern 2025 ⭐
**Status**: ✅ **Recommended**, production-ready

**Modern approach using PHP 8.3 attributes for automatic routing and OpenAPI generation.**

**Pros**:
- Zero-configuration routing with PHP attributes
- Automatic OpenAPI 3.1.0 spec generation
- Full integration with MikoPBX API registry
- Clean, maintainable code structure
- Follows 2025 best practices

**Cons**:
- Requires PHP 8.3+ (not a problem for MikoPBX)
- Slightly more initial setup

**Use when**: Starting a new module (default choice for all new development)

---

## Pattern Comparison

| Feature | v1 (Callback) | v2 (Controllers) | v3 (Attributes) ⭐ |
|---------|--------------|------------------|-------------------|
| **OpenAPI Spec** | ❌ Manual | ❌ Manual | ✅ Automatic |
| **Routing** | ❌ Manual | ❌ Manual | ✅ Automatic |
| **Code Organization** | ⚠️ Basic | ✅ Good | ✅ Excellent |
| **Maintainability** | ⚠️ Low | ✅ Medium | ✅ High |
| **Learning Curve** | ✅ Easy | ⚠️ Medium | ⚠️ Medium |
| **Recommended For** | Legacy, 1-2 endpoints | Migration, custom routing | **All new development** |

## Quick Start

### 1. Choose Your Pattern

```bash
# Modern approach (recommended)
cd ModuleExampleRestAPIv3

# Legacy approach (simple modules)
cd ModuleExampleRestAPIv1

# Transitional approach (migration)
cd ModuleExampleRestAPIv2
```

### 2. Study the Example

Each example includes:
- Complete working code
- Detailed README with implementation guide
- Comments explaining WHY, not just WHAT
- Test examples

### 3. Copy to Your Module

Use the example as a template for your own module development.

## Implementation Guides

- **[v1 Implementation Guide](ModuleExampleRestAPIv1/README.md)** - Simple callback pattern
- **[v2 Implementation Guide](ModuleExampleRestAPIv2/README.md)** - Custom controllers
- **[v3 Implementation Guide](ModuleExampleRestAPIv3/README.md)** - Modern attributes ⭐

## Common Use Cases

### "I want to add 1-2 simple API endpoints"
→ Use **v1** for minimal overhead

### "I'm migrating from v1 to modern pattern"
→ Use **v2** as intermediate step, then move to **v3**

### "I'm building a new module with REST API"
→ Use **v3** directly ⭐

### "I need complex custom routing logic"
→ Use **v2** for full control over routing

## 7-Phase Modern Pattern (v3)

The v3 pattern implements a standardized 7-phase lifecycle:

1. **Validation** - Input validation and sanitization
2. **Authentication** - User/token verification
3. **Authorization** - Permission checks
4. **Business Logic** - Core operation execution
5. **Data Transformation** - Format response data
6. **Response** - Send HTTP response
7. **Cleanup** - Release resources

See [ModuleExampleRestAPIv3 README](ModuleExampleRestAPIv3/README.md) for detailed explanation.

## Related Documentation

- [MikoPBX Development Docs](https://github.com/mikopbx/DevelopementDocs)
- [MikoPBX Core REST API](https://github.com/mikopbx/Core/tree/develop/src/PBXCoreREST)
- [OpenAPI Specification](https://spec.openapis.org/oas/v3.1.0)

## Migration Path

```
v1 (Callback)
    ↓
v2 (Controllers)  ← Transitional step
    ↓
v3 (Attributes) ⭐ ← Modern target
```

**Recommendation**: New modules should start with **v3** directly.

---

⭐ **TL;DR**: Use [ModuleExampleRestAPIv3](ModuleExampleRestAPIv3/) for all new development
