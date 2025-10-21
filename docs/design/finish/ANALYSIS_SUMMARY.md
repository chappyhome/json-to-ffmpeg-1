# Audio Type Classification - Analysis Summary

## Overview

This analysis provides a comprehensive design for implementing audio type classification in the json-to-ffmpeg project. The implementation will support two primary audio types:
- **BGM** (Background Music): Single instance, continuous playback, supports looping and fading
- **SFX** (Sound Effects): Multiple instances, precise timing triggers, can overlap

## Key Findings

### 1. Existing Type System is Well-Designed

The `AudioMetadata` type in `src/types/Inputs.ts` already contains all necessary fields:
- `audioType?: "bgm" | "sfx" | "narration"`
- `fadeIn?: number` (fade-in duration)
- `fadeOut?: number` (fade-out duration)
- `loop?: boolean` (for BGM looping)

**Status:** Type definition is complete, but not utilized in processing pipeline.

### 2. Current Audio Processing is Generic

`parseAudioClip.ts` currently:
- Applies basic trimming (`atrim`)
- Resets timestamps (`asetpts`)
- Adjusts volume
- Completely ignores metadata
- Treats all audio identically regardless of purpose

**Gap:** Audio types have no effect on generated FFmpeg filters.

### 3. Established Pattern from Text & Image Implementation

The codebase already has similar implementations:

**parseTextClip.ts:**
- Reads metadata from input sources (lines 82-85)
- Builds type-specific filter chains
- Uses helper functions for configuration parsing
- Example to follow

**parseImageClip.ts:**
- Determines media type from metadata (lines 45-47)
- Applies type-specific processing (GIF vs static)
- Calculates loop counts for looping media (lines 70-71)
- Similar to BGM looping pattern needed

## Architecture Overview

### Data Flow

```
Input JSON (audioType in metadata)
        |
        v
parseClip.ts (router)
        |
        v
parseAudioClip.ts (type-aware filtering)
        |
        +-- BGM: afade + aloop + volume
        |
        +-- SFX: adelay + optional fade + volume
        |
        v
parseTrack.ts (audio track composition)
        |
        v
Final FFmpeg command
```

### Filter Strategies

**For BGM:**
```
[input:a] → atrim → asetpts → afade(in) → aloop → afade(out) → volume → [output]
```
- Core purpose: Continuous background with smooth fade
- aloop handles duration extension
- Supports phase 2 mixing with SFX

**For SFX:**
```
[input:a] → atrim → asetpts → adelay → afade(in) → afade(out) → volume → [output]
```
- Core purpose: Event-triggered sound at precise timeline position
- adelay places sound at exact start time
- Optional fading for smoothness

## Implementation Approach

### Phase 1: Core Audio Type Filtering (Recommended Priority)

**Scope:** Add metadata-aware filter generation to parseAudioClip.ts

**Changes:**
1. parseAudioClip.ts (40 lines → 80-100 lines)
   - Read AudioMetadata from inputs
   - Branch on audioType
   - Build appropriate filter chain

2. parseClip.ts (minimal)
   - Pass inputs and output parameters

3. src/types/Inputs.ts (documentation)
   - Add JSDoc comments

**Benefits:**
- BGM can fade in/out smoothly
- BGM can loop automatically
- SFX can trigger at precise times
- Backward compatible (defaults to SFX)

**Estimated Effort:** 5-7 hours

### Phase 2: Audio Track Mixing (Future Enhancement)

**Scope:** Enable simultaneous BGM + SFX playback

**Changes:**
1. parseTrack.ts
   - Detect mixed audio composition
   - Use `amix` filter instead of `concat` when appropriate

**Benefits:**
- BGM plays continuously in background
- Multiple SFX can trigger over BGM
- More realistic audio composition

**Estimated Effort:** 4-6 hours

## FFmpeg Filters Required

| Filter | Type | Purpose | Phase |
|--------|------|---------|-------|
| atrim | Core | Audio trimming by offset/duration | 1 |
| asetpts | Core | Timestamp reset for synchronization | 1 |
| volume | Core | Volume adjustment | 1 |
| afade | BGM | Fade audio in/out smoothly | 1 |
| aloop | BGM | Loop audio to extend duration | 1 |
| adelay | SFX | Delay audio start for precise timing | 1 |
| amix | Mix | Mix multiple streams simultaneously | 2 |
| concat | Mix | Concatenate audio sequentially | 1 (existing) |

## Integration Points

### Key Code Locations

1. **src/parseAudioClip.ts** (lines 10-41)
   - Primary implementation location
   - Needs complete refactor

2. **src/parseClip.ts** (lines 35-36)
   - Add inputs and output parameters
   - Minimal change

3. **src/parseTrack.ts** (lines 279-285)
   - No change for Phase 1
   - Enhanced for Phase 2

4. **src/types/Inputs.ts** (lines 20-29)
   - Already correct
   - Add documentation

## Design Patterns to Follow

### From parseTextClip.ts
- Metadata extraction: `const input = findInput(inputs, source)`
- Type casting: `const metadata = input?.metadata as TextMetadata`
- Filter composition: Build array of strings, join with commas
- Complex generation: Build full command with newlines/indentation

### From parseImageClip.ts
- Type detection: Check metadata properties for media type
- Loop calculation: `Math.ceil(duration / sourceDuration)`
- Transform application: Scale and position based on output config

## Backward Compatibility Strategy

**Core Principle:** All changes are additive, never breaking

1. **Optional Parameters:** inputs and output are new parameters to parseAudioClip
   - Requires updating parseClip.ts call site
   - parseClip already has access to these values
   - No change to function behavior if not used

2. **Default Behavior:** audioType defaults to "sfx"
   - Maintains current audio behavior
   - All existing configs work unchanged

3. **Metadata is Optional:** AudioMetadata can be undefined
   - Graceful degradation to standard audio behavior
   - No errors if metadata missing

4. **Test Coverage:** Existing tests must continue passing
   - Verify with existing audio test fixtures
   - Add new tests for new features

## Risk Analysis

### Technical Risks

**Risk: Filter Syntax Errors**
- Mitigation: Comprehensive unit tests for filter generation
- Mitigation: Generate from well-tested templates

**Risk: Timing Issues with adelay**
- Mitigation: Use stereo-aware format (e.g., `adelay=5000|5000`)
- Mitigation: Test with various channel configurations

**Risk: Memory with Long Loops**
- Mitigation: Document loop limitations
- Mitigation: Recommend preprocessing for extensive looping

### Implementation Risks

**Risk: Breaking Existing Audio**
- Mitigation: Extensive backward compatibility testing
- Mitigation: Default behavior unchanged

**Risk: Complex Filter Chains**
- Mitigation: Follow established pattern from TextClip
- Mitigation: Use helper functions for clarity

### Minimal Risks

- Type system already designed correctly
- Pattern exists from similar features
- No external dependencies needed
- Pure filter composition, no new FFmpeg modes

## Success Criteria

### Phase 1 Success Metrics

- [ ] BGM clips support fade-in/fade-out
- [ ] BGM clips support looping
- [ ] SFX clips support precise timing via adelay
- [ ] All existing audio functionality preserved
- [ ] Backward compatible (100% of existing tests pass)
- [ ] FFmpeg commands generate correctly
- [ ] Documentation complete

### Phase 2 Success Metrics

- [ ] BGM plays continuously while SFX trigger over it
- [ ] Multiple SFX can overlap on same track
- [ ] Backward compatible (concat still used when appropriate)
- [ ] Audio mixing works smoothly

## Documentation Deliverables

### For Users
1. AUDIO_TYPES_USER_GUIDE.md
   - How to use BGM vs SFX
   - JSON configuration examples
   - Best practices

2. README.md Update
   - Feature summary
   - Quick example

### For Developers
1. Code documentation in JSDoc
   - Function signatures
   - Filter chain explanations
   - Metadata field meanings

2. AUDIO_TYPE_IMPLEMENTATION.md
   - Technical deep dive
   - Architecture decisions
   - Extension points

## Testing Strategy

### Unit Tests
- Metadata parsing
- BGM filter generation
- SFX filter generation
- Loop count calculation
- Delay calculation
- Default handling

### Integration Tests
- Full FFmpeg command generation
- Filter syntax validation
- Phase 1 backward compatibility
- Existing test fixtures still pass

### Test Fixtures
- audio-types-timeline.json
  - BGM with fade and loop
  - Multiple SFX at different times
  - Edge cases

## Recommended Next Steps

### Immediate (Before Implementation)
1. Review design documents with team
2. Validate FFmpeg filter chains manually
3. Confirm implementation approach
4. Estimate task sizing

### Implementation Phase 1
1. Update parseAudioClip.ts
   - Add metadata reading
   - Add type detection
   - Build filter chains
   - Add helper functions

2. Update parseClip.ts
   - Pass new parameters

3. Add documentation
   - JSDoc comments
   - Type comments

4. Create test fixtures
   - audio-types-timeline.json
   - Unit tests

5. Verify backward compatibility
   - Run existing tests
   - Add regression tests

### Implementation Phase 2 (After Phase 1)
1. Analyze track composition
2. Implement amix logic
3. Test mixed audio
4. Documentation

## Appendices

### Appendix A: File Location Reference

- Project Root: `/Volumes/工作区/video-project/json-to-ffmpeg`
- Source: `/Volumes/工作区/video-project/json-to-ffmpeg/src`
- Types: `/Volumes/工作区/video-project/json-to-ffmpeg/src/types`
- Tests: `/Volumes/工作区/video-project/json-to-ffmpeg/worker/test`

### Appendix B: FFmpeg Command Examples

See ARCHITECTURE_DIAGRAM.md for complete examples including:
- Simple BGM Loop
- SFX with Delay
- Multiple SFX Sequential
- BGM + SFX Mixed

### Appendix C: Implementation Checklist

See IMPLEMENTATION_CHECKLIST.md for detailed checklist with:
- Phase 1 implementation tasks
- Phase 2 implementation tasks
- Code review checklist
- Documentation checklist
- Sign-off criteria

---

## Conclusion

The json-to-ffmpeg codebase is well-structured for adding audio type classification. The existing type system is complete, similar features exist as patterns to follow, and the implementation can be done in two manageable phases with minimal risk to existing functionality.

Phase 1 enables BGM looping/fading and SFX precise timing using type-aware filter chains. Phase 2 enables simultaneous BGM + SFX mixing for more realistic audio composition.

The implementation is straightforward, follows established patterns, and maintains full backward compatibility.
