# Implementation Strategy

Based on analysis of your project structure, here's a comprehensive **phased strategy** to move your gemini-cli-adapter from its current rough layout to a fully functional, decoupled system:

## **Phase 1: Foundation Stabilization** (1-2 weeks)

### **1.1 Complete Core Interface**
- **Add missing Icon type** to `packages/core-interface/src/types/tools.ts`
- **Audit and abstract** all Google-specific types currently imported in cli-frontend
- **Define generic error types** for adapter communication
- **Add missing tool execution types** (progress, status, cancellation)

### **1.2 Fix Direct Dependencies** 
- **Replace 45 @google/gemini-cli-core imports** in cli-frontend with core-interface types
- **Priority files**: `acp/acp.ts`, `config/*.ts`, `ui/commands/*.ts`
- **Create type mapping document** for migration reference

## **Phase 2: Adapter Bridge Implementation** (2-3 weeks)

### **2.1 Implement AdapterBridge**
- **Complete the TODO methods** in `AdapterBridge.ts:138-140`
- **Add session management** and state tracking
- **Implement configuration bridging** between old and new interfaces
- **Add comprehensive error handling** and logging

### **2.2 CLI Frontend Refactoring**
- **Systematically replace** direct core imports with AdapterBridge calls
- **Update service layers** (GitService, auth, config) to use bridge
- **Refactor React hooks** to work with new adapter pattern
- **Update command implementations** to use generic adapter interface

## **Phase 3: Google Adapter Implementation** (2-3 weeks)

### **3.1 Core Functionality**
- **Implement all GoogleAdapter methods** (currently all throw "Not implemented")
- **Add @google/genai SDK integration**
- **Implement streaming chat** with proper event mapping
- **Add tool discovery and execution**

### **3.2 Configuration & Auth**
- **Implement config validation** with Google-specific rules
- **Add authentication flow** integration
- **Handle API key management** and validation

## **Phase 4: Demo Application Wiring** (1 week)

### **4.1 Complete Integration**
- **Wire up GoogleAdapter** in `apps/gemini-cli/src/index.ts`
- **Initialize AdapterBridge** properly
- **Connect to actual CLI frontend** (not just placeholder commands)
- **Add proper error handling** and graceful degradation

### **4.2 Command Implementation**
- **Replace placeholder chat command** with full functionality
- **Add configuration management** commands
- **Implement adapter switching** mechanism

## **Phase 5: Testing & Validation** (1-2 weeks)

### **5.1 Functionality Testing**
- **End-to-end chat sessions** work correctly
- **Tool execution** functions properly
- **Configuration management** is seamless
- **Error handling** is robust

### **5.2 Decoupling Validation**
- **Verify zero direct dependencies** on @google/gemini-cli-core in cli-frontend
- **Test adapter swapping** capability
- **Validate interface completeness** for third-party adapters

## **Critical Dependencies & Priorities**

### **Immediate Blockers (Start Here)**
1. **Icon type definition** in core-interface (`acp.ts` import failure)
2. **Complete type audit** of cli-frontend dependencies
3. **AdapterBridge.getConfig()** implementation

### **High-Risk Areas**
- **45 files** with @google/gemini-cli-core imports need careful migration
- **React hooks** may have complex state dependencies
- **Authentication flows** might be tightly coupled

### **Success Metrics**
- ✅ Zero imports of @google/gemini-cli-core in cli-frontend
- ✅ GoogleAdapter passes all interface method calls
- ✅ Demo CLI provides equivalent functionality to original
- ✅ Third-party adapter can be plugged in without CLI changes

**Recommended starting point**: Phase 1.1 - Add the Icon type and begin the dependency audit. This will immediately unblock development and provide visibility into the full scope of refactoring needed.