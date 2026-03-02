# Structural Review & Refactor: Fix UI Hangs + Testing Architecture

## Phase 1: Deep Diagnosis
- [ ] Identify Svelte 4 vs 5 API usage across all components
- [ ] Map all reactive patterns ($:, stores, event dispatchers) for correctness
- [ ] Trace the exact chat selection → message loading flow end-to-end
- [ ] Identify the hang: is it frontend infinite loop, backend timeout, or both?
- [ ] Audit all component lifecycle patterns

## Phase 2: Svelte 5 Migration Audit
- [ ] Catalog all Svelte 4 patterns still in use (createEventDispatcher, $:, on:event, etc.)
- [ ] Determine if we should fully commit to Svelte 5 runes or stay on legacy compat
- [ ] Fix all reactive patterns that cause infinite loops in Svelte 5

## Phase 3: Testing Architecture Overhaul
- [ ] Audit current test coverage vs actual UI behavior
- [ ] Identify why tests pass but UI hangs (mock vs real behavior gap)
- [ ] Design integration tests that actually catch these issues
- [ ] Implement meaningful tests that correlate with real performance

## Phase 4: Implementation
- [ ] Fix all identified issues
- [ ] Refactor components as needed
- [ ] Update tests to match
- [ ] Verify end-to-end in browser

## Phase 5: Final Verification
- [ ] Full browser test of all UI flows
- [ ] All tests pass and are meaningful
- [ ] Commit and push