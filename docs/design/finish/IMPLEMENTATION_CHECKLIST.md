# Audio Type Classification - Implementation Checklist

## Phase 1: Core Audio Type Filtering Implementation

### 1. Type System Updates

- [ ] **Review src/types/Inputs.ts**
  - [x] AudioMetadata type already has correct structure
  - [ ] Add JSDoc comments explaining:
    - [ ] `audioType` field: "bgm" | "sfx" | "narration"
    - [ ] `fadeIn`: Duration in seconds for fade-in
    - [ ] `fadeOut`: Duration in seconds for fade-out
    - [ ] `loop`: Whether to loop (BGM)

**Example addition:**
```typescript
export type AudioMetadata = {
  /**
   * Audio clip type classification
   * - "bgm": Background music (single instance, loopable, supports fading)
   * - "sfx": Sound effects (multiple instances, precise timing via adelay)
   * - "narration": Dialogue/voiceover (reserved for future)
   */
  audioType?: "bgm" | "sfx" | "narration";
  
  /** Duration in seconds for fade-in effect at clip start */
  fadeIn?: number;
  
  /** Duration in seconds for fade-out effect at clip end */
  fadeOut?: number;
  
  /** Whether to loop audio when clip duration > source duration (BGM) */
  loop?: boolean;
  
  // ... existing fields ...
};
```

### 2. Core Implementation: parseAudioClip.ts

**Current state:**
- File: `/Volumes/工作区/video-project/json-to-ffmpeg/src/parseAudioClip.ts`
- Lines: 10-41

**Changes needed:**

- [ ] **Update function signature**
  ```typescript
  export function parseAudioClip({
    clip,
    inputFiles,
    inputs,      // ADD
    output,      // ADD
  }: {
    clip: AudioClip;
    inputFiles: InputFiles;
    inputs: Inputs;        // ADD
    output: Output;        // ADD
  }): string
  ```

- [ ] **Add imports**
  ```typescript
  import { Inputs, AudioMetadata } from "./types/Inputs";
  import { Output } from "./types/Output";
  import { findInput } from "./utils/findInput";
  ```

- [ ] **Add metadata reading logic**
  ```typescript
  const input = findInput(inputs, source);
  const metadata = input?.metadata as AudioMetadata | undefined;
  const audioType = metadata?.audioType || "sfx";
  const fadeIn = metadata?.fadeIn || 0;
  const fadeOut = metadata?.fadeOut || 0;
  const shouldLoop = metadata?.loop !== false;
  ```

- [ ] **Add BGM handling**
  - [ ] Check if `audioType === "bgm"`
  - [ ] Add fade-in filter: `afade=t=in:st=0:d=${fadeIn}`
  - [ ] Calculate loop count if `shouldLoop && sourceDuration < clipDuration`
  - [ ] Add aloop filter: `aloop=${loopCount}:${framesPerLoop}`
  - [ ] Add fade-out filter: `afade=t=out:st=${fadeOutStart}:d=${fadeOut}`

- [ ] **Add SFX handling**
  - [ ] Check if `audioType === "sfx"`
  - [ ] Calculate delay from `timelineTrackStart`: `const delayMs = Math.round(clip.timelineTrackStart * 1000)`
  - [ ] Add adelay filter: `adelay=${delayMs}|${delayMs}`
  - [ ] Optional: Add fade-in/out for SFX smoothness

- [ ] **Add helper function for loop count calculation**
  ```typescript
  function calculateAudioLoopCount(
    sourceDuration: number,
    clipDuration: number
  ): number {
    // Similar to parseImageClip.ts line 70
    return Math.ceil(clipDuration / sourceDuration);
  }
  ```

- [ ] **Ensure filter order**
  1. atrim
  2. asetpts
  3. adelay (SFX only)
  4. afade (t=in)
  5. aloop (BGM only)
  6. afade (t=out)
  7. volume

### 3. Integration: parseClip.ts

**Current state:**
- File: `/Volumes/工作区/video-project/json-to-ffmpeg/src/parseClip.ts`
- Lines: 35-36

**Changes needed:**

- [ ] **Update audio clip handling**
  ```typescript
  } else if (clip.clipType === "audio") {
    clipString += parseAudioClip({ 
      clip, 
      inputFiles,
      inputs,      // ADD
      output,      // ADD
    });
  }
  ```

### 4. Documentation: src/types/Inputs.ts

- [ ] **Add comprehensive JSDoc**
  - [ ] Explain each audioType
  - [ ] Document metadata fields
  - [ ] Provide examples

**Checklist item priority: HIGH**

### 5. Testing Phase 1

- [ ] **Create test fixture: audio-types-timeline.json**
  - [ ] Include BGM with fadeIn, fadeOut, loop
  - [ ] Include SFX with precise timing
  - [ ] Multiple SFX clips at different timelineTrackStart positions

**Fixture should include:**
```json
{
  "inputs": {
    "bgm_source": {
      "type": "audio",
      "metadata": {
        "audioType": "bgm",
        "fadeIn": 1.5,
        "fadeOut": 1,
        "loop": true
      }
    },
    "sfx_click": {
      "type": "audio",
      "metadata": {
        "audioType": "sfx",
        "fadeIn": 0.05,
        "fadeOut": 0.1
      }
    }
  },
  "tracks": {
    "audio": {
      "type": "audio",
      "clips": [
        {
          "name": "bgm_clip",
          "source": "bgm_source",
          "timelineTrackStart": 0,
          "duration": 8,
          "metadata": { audioType: "bgm", fadeIn: 1 }
        },
        {
          "name": "sfx_1",
          "source": "sfx_click",
          "timelineTrackStart": 1.5,
          "duration": 0.2,
          "metadata": { audioType: "sfx" }
        },
        {
          "name": "sfx_2",
          "source": "sfx_click",
          "timelineTrackStart": 3,
          "duration": 0.2,
          "metadata": { audioType: "sfx" }
        }
      ]
    }
  }
}
```

- [ ] **Unit tests for parseAudioClip.ts**
  - [ ] Test metadata reading
  - [ ] Test BGM filter chain generation
  - [ ] Test SFX filter chain generation
  - [ ] Test loop count calculation
  - [ ] Test delay calculation
  - [ ] Test default audioType ("sfx")

- [ ] **Integration tests**
  - [ ] Generate full FFmpeg command
  - [ ] Verify filter syntax correctness
  - [ ] Check filter order

### 6. Backward Compatibility Check

- [ ] **Test existing audio configurations**
  - [ ] Audio clips without metadata still work
  - [ ] Audio clips without audioType default to "sfx"
  - [ ] Existing test fixtures still pass

- [ ] **Verify no breaking changes**
  - [ ] Function only adds optional parameters
  - [ ] Default behavior unchanged
  - [ ] All existing configs produce same output

---

## Phase 2: Audio Track Mixing (Follow-up PR)

**Note: This is for future implementation, not Phase 1**

### 1. Enhanced parseTrack.ts

- [ ] **Add track composition analysis**
  - [ ] Detect if track has BGM clips
  - [ ] Detect if track has SFX clips
  - [ ] Determine composition type

- [ ] **Add helper functions**
  ```typescript
  function isBackgroundMusic(clip: any, inputs: Inputs): boolean {}
  function isSoundEffect(clip: any, inputs: Inputs): boolean {}
  function analyzeAudioTrackComposition(): "bgm" | "sfx" | "mixed" {}
  ```

- [ ] **Implement amix logic**
  - [ ] For mixed tracks: use `amix` filter instead of `concat`
  - [ ] Maintain backward compatibility
  - [ ] Handle proper input count

- [ ] **Update audio track concatenation logic** (parseTrack.ts lines 279-285)

### 2. Phase 2 Testing

- [ ] **Test BGM + SFX mixing**
  - [ ] Create test fixture with mixed audio track
  - [ ] Verify amix filter is used
  - [ ] Check simultaneous playback

- [ ] **Test backward compatibility**
  - [ ] Sequential-only tracks still use concat
  - [ ] All existing tests pass

---

## Code Review Checklist

### Code Quality

- [ ] All new functions have JSDoc comments
- [ ] Filter chains are well-formatted and readable
- [ ] No magic numbers (all constants defined)
- [ ] Error handling for edge cases
  - [ ] Missing metadata handled gracefully
  - [ ] Invalid audioType defaults to "sfx"
  - [ ] Zero/negative values handled

### Performance

- [ ] Filter chain is efficient
  - [ ] Only necessary filters applied
  - [ ] No duplicate operations
  - [ ] Filters in optimal order

### Maintainability

- [ ] Code follows existing patterns
  - [ ] Similar to parseImageClip.ts structure
  - [ ] Similar to parseTextClip.ts metadata reading
- [ ] Helper functions properly extracted
- [ ] Constants defined clearly

### Testing

- [ ] Unit tests cover all branches
- [ ] Integration tests verify FFmpeg syntax
- [ ] Edge cases tested
- [ ] Backward compatibility verified

---

## Documentation Checklist

### Code Documentation

- [ ] JSDoc on parseAudioClip function
- [ ] Comments on complex filter chains
- [ ] Helper function documentation
- [ ] Type definitions documented

### User Documentation

- [ ] Create `AUDIO_TYPES_USER_GUIDE.md`
  - [ ] Explain BGM vs SFX
  - [ ] Show example JSON configurations
  - [ ] Document all metadata fields
  - [ ] Provide use cases and examples

- [ ] Update main `README.md`
  - [ ] Add audio type classification to features
  - [ ] Add quick example

- [ ] Create `AUDIO_TYPE_IMPLEMENTATION.md`
  - [ ] Technical details for developers
  - [ ] Filter chain explanations
  - [ ] Extension points for future features

### Examples

- [ ] BGM with fade in/out
- [ ] SFX with precise timing
- [ ] Multiple SFX sequential
- [ ] Multiple SFX with different volumes

---

## Verification Checklist (Pre-commit)

- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] Code follows project style
- [ ] No console.log statements
- [ ] Comments are clear and accurate
- [ ] Documentation is complete
- [ ] Backward compatibility maintained
- [ ] FFmpeg command syntax is correct

---

## Known Limitations & Future Work

### Phase 1 Limitations

- [ ] Acknowledged: Phase 1 uses concat for all audio tracks
  - [ ] Prevents simultaneous BGM + SFX playback
  - [ ] Planned for Phase 2

- [ ] Documented: Narration type not yet implemented
  - [ ] Reserved for future
  - [ ] Currently defaults to SFX behavior

### Phase 2 Features

- [ ] Add amix support for simultaneous audio
- [ ] Add ducking control for BGM when SFX plays
- [ ] Add narration support
- [ ] Add audio normalization options

### Performance Considerations

- [ ] Document loop limit warnings
- [ ] Recommend audio preprocessing for very short loops
- [ ] Note CPU usage for high-stream mixing

---

## Sign-off Criteria

Phase 1 is complete when:

- [x] AudioMetadata type has required fields
- [ ] parseAudioClip.ts reads metadata and applies type-specific filters
- [ ] parseClip.ts passes inputs and output to parseAudioClip
- [ ] Backward compatibility fully maintained
- [ ] All tests pass (existing + new)
- [ ] Documentation is complete
- [ ] Code review approved
- [ ] No regressions in existing functionality

---

## File Change Summary

| File | Lines Changed | Type |
|------|:--:|:--|
| src/parseAudioClip.ts | Replace lines 1-41 | Major Refactor |
| src/parseClip.ts | Update lines 35-36 | Minor Update |
| src/types/Inputs.ts | Add JSDoc (lines 20-29) | Documentation |
| worker/test/fixtures/audio-types-timeline.json | Create new | Test Fixture |
| Test files | Create new unit/integration tests | Testing |
| AUDIO_TYPES_USER_GUIDE.md | Create new | Documentation |
| README.md | Add feature mention | Documentation |

---

## Implementation Timeline

**Phase 1 Estimated Effort:**
- Core Implementation: 2-3 hours
- Testing: 1-2 hours
- Documentation: 1 hour
- Code Review & Fixes: 1 hour
- **Total: 5-7 hours**

**Phase 2 Estimated Effort:**
- Amix Implementation: 2-3 hours
- Testing: 1-2 hours
- Documentation: 1 hour
- **Total: 4-6 hours**

---

## References

### Related Files
- parseImageClip.ts - Pattern for metadata handling
- parseTextClip.ts - Pattern for filter composition
- parseTrack.ts - Current audio track handling

### FFmpeg Documentation
- afade filter: https://ffmpeg.org/ffmpeg-filters.html#afade
- aloop filter: https://ffmpeg.org/ffmpeg-filters.html#aloop
- adelay filter: https://ffmpeg.org/ffmpeg-filters.html#adelay
- amix filter: https://ffmpeg.org/ffmpeg-filters.html#amix
- concat filter: https://ffmpeg.org/ffmpeg-filters.html#concat

