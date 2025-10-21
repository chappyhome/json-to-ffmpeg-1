#!/bin/bash
echo "=== Detailed Audio Analysis Using astats ==="
echo ""

analyze_segment() {
    local start=$1
    local duration=$2
    local label=$3
    
    echo "[$label] at ${start}s for ${duration}s:"
    ffmpeg -i output-audio-types-test.mp4 -ss $start -t $duration -af "astats=metadata=1:reset=1" -vn -f null - 2>&1 | \
        grep -E "(RMS level|Peak level|DC offset)" | head -6
    echo ""
}

# BGM only baseline
analyze_segment 0.5 0.5 "BGM only (0.5-1.0s)"

# click1 at 1.5s
analyze_segment 1.5 0.3 "click1 at 1.5s"

# BGM only between SFX
analyze_segment 2.0 0.5 "BGM only (2.0-2.5s)"

# notification1 at 3.0s
analyze_segment 3.0 0.8 "notification1 at 3.0s"

# BGM only between SFX
analyze_segment 4.0 0.5 "BGM only (4.0-4.5s)"

# whoosh1 at 5.5s
analyze_segment 5.5 1.0 "whoosh1 at 5.5s"

# BGM only between SFX
analyze_segment 7.0 0.5 "BGM only (7.0-7.5s)"

# click2 at 8.0s
analyze_segment 8.0 0.3 "click2 at 8.0s"

