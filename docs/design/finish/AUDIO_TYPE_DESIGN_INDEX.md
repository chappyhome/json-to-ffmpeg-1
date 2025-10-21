# Audio Type Classification - Documentation Index

This directory contains comprehensive design documentation for implementing audio type classification (BGM vs SFX) in the json-to-ffmpeg project.

## Quick Navigation

### For Quick Understanding
Start here: **[ANALYSIS_SUMMARY.md](./ANALYSIS_SUMMARY.md)** (10 min read)
- Executive overview of the feature
- Key findings from codebase analysis
- Implementation approach and phases
- Success criteria

### For Architecture Understanding
Read: **[ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)** (15 min read)
- Current vs proposed architecture flows
- Data flow diagrams for BGM and SFX
- Filter chain pseudocode
- FFmpeg command examples
- Integration point changes

### For Implementation Details
Read: **[AUDIO_TYPE_CLASSIFICATION_DESIGN.md](./AUDIO_TYPE_CLASSIFICATION_DESIGN.md)** (20 min read)
- Detailed implementation architecture
- FFmpeg filter reference
- Two-phase implementation plan
- Code integration points
- Testing strategy
- Risk assessment

### For Implementation Execution
Use: **[IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)** (as reference)
- Step-by-step implementation tasks
- Code review checklist
- Testing checklist
- Documentation checklist
- Sign-off criteria

---

## Document Overview

### ANALYSIS_SUMMARY.md
**Best for:** Getting started, understanding the big picture

**Contains:**
- Key findings from codebase analysis
- Existing type system review
- Current audio processing gaps
- Architecture overview
- Implementation approach
- Success criteria
- Recommended next steps

**Key Takeaway:** The codebase is well-structured. The type system is ready. Just need to wire up filter generation in parseAudioClip.ts

### AUDIO_TYPE_CLASSIFICATION_DESIGN.md
**Best for:** Technical implementation details

**Contains:**
- Current state analysis
- Design requirements
- Implementation architecture
- Code integration points
- FFmpeg audio filter reference
- Implementation phases
- Backward compatibility strategy
- Performance considerations

**Key Takeaway:** Phased approach: Phase 1 for metadata-aware filtering, Phase 2 for mixed audio support

### ARCHITECTURE_DIAGRAM.md
**Best for:** Visual understanding and examples

**Contains:**
- Current vs proposed flows
- BGM and SFX data flows
- Type detection logic tree
- Filter chain construction pseudocode
- Integration point changes
- Parameter flow examples
- FFmpeg command examples
- Key differences table

**Key Takeaway:** See exactly what filters go where and why

### IMPLEMENTATION_CHECKLIST.md
**Best for:** Execution tracking and code review

**Contains:**
- Phase 1 implementation checklist
- Phase 2 implementation checklist
- Code quality checklist
- Performance checklist
- Testing checklist
- Documentation checklist
- Verification checklist
- Known limitations

**Key Takeaway:** Use as a reference during implementation and code review

---

## Quick Facts

### Scope
- Add type-aware audio processing
- Support BGM (looping, fading) and SFX (precise timing)
- Implement in two phases

### Key Changes
- **parseAudioClip.ts**: 40 lines → 80-100 lines
- **parseClip.ts**: Minimal (add 2 parameters)
- **Inputs.ts**: Documentation only

### Files Modified
1. src/parseAudioClip.ts (major)
2. src/parseClip.ts (minor)
3. src/types/Inputs.ts (documentation)
4. Test fixtures (new)
5. Documentation (new)

### FFmpeg Filters
- BGM: `afade`, `aloop`
- SFX: `adelay`
- Core: `atrim`, `asetpts`, `volume`
- Mixing: `amix` (Phase 2)

### Effort Estimate
- Phase 1: 5-7 hours
- Phase 2: 4-6 hours
- Total: 9-13 hours

### Backward Compatibility
- 100% backward compatible
- All existing code continues to work
- New features are opt-in

---

## How to Use These Documents

### As a Developer Starting Implementation
1. Read ANALYSIS_SUMMARY.md first (overview)
2. Study ARCHITECTURE_DIAGRAM.md for examples
3. Reference AUDIO_TYPE_CLASSIFICATION_DESIGN.md for details
4. Follow IMPLEMENTATION_CHECKLIST.md during coding
5. Use as reference during code review

### As a Code Reviewer
1. Skim ANALYSIS_SUMMARY.md for context
2. Reference IMPLEMENTATION_CHECKLIST.md for review criteria
3. Check AUDIO_TYPE_CLASSIFICATION_DESIGN.md for architectural decisions
4. Verify against ARCHITECTURE_DIAGRAM.md examples

### As a Project Manager
1. Read ANALYSIS_SUMMARY.md (overview)
2. Check "Effort Estimate" section in this file
3. Review implementation phases and timeline
4. Track progress against IMPLEMENTATION_CHECKLIST.md

### As Someone Learning the Codebase
1. Start with ARCHITECTURE_DIAGRAM.md (visual)
2. Read ANALYSIS_SUMMARY.md (context)
3. Reference AUDIO_TYPE_CLASSIFICATION_DESIGN.md for details
4. Study code examples in ARCHITECTURE_DIAGRAM.md

---

## Key Design Decisions

### Why Phase 1 and Phase 2?
- Phase 1 is simpler and provides most value
- Phase 1 uses existing concat filter (lower risk)
- Phase 2 requires amix (more complex)
- Both phases are independent, can ship separately

### Why Not Implement Phase 2 Immediately?
- Phase 1 solves 80% of use cases
- Sequential audio often sufficient
- Phase 2 adds complexity (audio mixing)
- Can gather feedback before Phase 2

### Why audioType in Metadata?
- Metadata is already used by Text and Image types
- Consistent with existing pattern
- Allows future audio metadata expansion
- Clean separation of concerns

### Why Not Change parseTrack.ts in Phase 1?
- Current concat behavior acceptable for sequential audio
- Phase 1 focuses on clip-level filtering
- Track-level changes can come in Phase 2
- Simpler initial implementation

---

## Pattern References

### Similar Implementations in Codebase

**parseTextClip.ts** (for metadata reading pattern)
- Lines 82-85: Metadata extraction
- Lines 90-99: Default value application
- Lines 102-162: Filter chain building
- Pattern: Read metadata → Build type-specific filters

**parseImageClip.ts** (for loop calculation pattern)
- Lines 45-47: Type detection from metadata
- Lines 70-71: Loop count calculation
- Lines 86-90: Loop filter application
- Pattern: Detect type → Calculate parameters → Apply filters

---

## Testing Strategy Summary

### Unit Tests
- Metadata reading
- Filter generation per type
- Loop count calculation
- Delay calculation

### Integration Tests
- Full FFmpeg command generation
- Filter syntax validation
- Backward compatibility

### Test Fixture
- BGM with fade and loop
- Multiple SFX with timing
- Edge cases

---

## FFmpeg Filter Quick Reference

| Filter | Usage | Example |
|--------|-------|---------|
| atrim | Trim audio | `atrim=0:5` (first 5 seconds) |
| asetpts | Reset PTS | `asetpts=PTS-STARTPTS` |
| afade | Fade in/out | `afade=t=in:st=0:d=1` (1s fade-in at start) |
| aloop | Loop audio | `aloop=3:60` (loop 3 times, 60 frames each) |
| adelay | Delay audio | `adelay=2500\|2500` (2.5s delay, stereo) |
| amix | Mix streams | `amix=inputs=3:duration=longest` (mix 3 inputs) |
| volume | Volume level | `volume=0.8` (80% volume) |

---

## Common Questions

**Q: Will this break existing audio processing?**
A: No. All changes are backward compatible. Default audioType is "sfx" which maintains current behavior.

**Q: Do I need to add metadata to all audio?**
A: No. Metadata is optional. Without it, audio defaults to "sfx" behavior (current behavior).

**Q: When should I use BGM vs SFX?**
A: Use BGM for background music, ambient sounds, or anything that needs to loop or fade. Use SFX for event-triggered sounds like buttons clicks, notifications, etc.

**Q: Can I have both BGM and SFX in same track?**
A: Phase 1: They'll play sequentially (one then the other). Phase 2: They'll mix (simultaneous).

**Q: Why not just use FFmpeg directly?**
A: This project abstracts FFmpeg complexity into a clean JSON format with proper metadata handling.

---

## File Locations

All files in json-to-ffmpeg root directory:

- `/ANALYSIS_SUMMARY.md` - Start here
- `/ARCHITECTURE_DIAGRAM.md` - Visual reference
- `/AUDIO_TYPE_CLASSIFICATION_DESIGN.md` - Technical details
- `/IMPLEMENTATION_CHECKLIST.md` - Implementation guide
- `/AUDIO_TYPE_DESIGN_INDEX.md` - This file

Source files to modify:
- `src/parseAudioClip.ts` - Primary implementation
- `src/parseClip.ts` - Integration point
- `src/types/Inputs.ts` - Documentation
- `worker/test/fixtures/audio-types-timeline.json` - Test fixture (create new)

---

## Next Steps

1. **Review** these documents
2. **Validate** FFmpeg filter chains manually (optional)
3. **Plan** implementation sprint
4. **Implement** Phase 1 following checklist
5. **Test** thoroughly
6. **Review** code against criteria
7. **Document** user guide
8. **Ship** Phase 1
9. **Gather feedback**
10. **Plan** Phase 2

---

## Questions or Issues?

If you have questions about the design:
1. Check the appropriate document above
2. Review the FFmpeg filter reference
3. Look at code examples in ARCHITECTURE_DIAGRAM.md
4. Check the Implementation Checklist for specific steps

---

Generated: 2025-10-21
Project: json-to-ffmpeg
Feature: Audio Type Classification (BGM vs SFX)
