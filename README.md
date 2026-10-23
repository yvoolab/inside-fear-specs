# Inside Fear — a Specs Lens

Step inside the brain's fear centre. A one-metre brain floats in your room; a voice of blame lights up the
amygdala; pinch **Enter** and it grows around you, turning the textbook fear pathway into a narrated
scene of neurons and synapses. Built for the Devpost *Learn AR with Specs* hackathon.

- Design brief (from the `plan-lens` interview): [`devpost/design-brief.md`](devpost/design-brief.md)
- Submission text: [`devpost/submission.md`](devpost/submission.md)
- Test results: [`devpost/leaf-results.md`](devpost/leaf-results.md)

## Run it
1. Open `cafe-fr.esproj` in **Lens Studio 5.22 or newer** (built with 5.24.1). The folder name is a leftover
   from an earlier idea; the Lens itself is *Inside Fear*.
2. Press Play in the Preview panel (Specs / Interactive Preview). Click = pinch.
3. **Start** → the amygdala lights up → **Enter** → inside, use **Next** four times → **退 / Exit**.
   Use right-drag (or Shift) to look around; step 3 is behind you.

## Tests (LEAF)
`Assets/LeafTests/` holds one LEAF scenario per done criterion of the brief, registered in `LeafIndex.ts`.
Open the LEAF panel in Lens Studio and run `criterion-1-start` … `criterion-5-exit` (serially).

## Layout
```
Assets/Scripts/      InsideFearMain.ts (state machine), InsideFearInterior.ts, InsideFear*UI.ts
Assets/LeafTests/    LEAF scenarios + LeafIndex.ts
Assets/GeneratedSFX/ synthetic audio: Piper TTS narration (Step1-4) + generated tones — generators in tempAssetGen/
Assets/Materials, Meshes, Icons
Packages/            Spectacles Interaction Kit, Spectacles UI Kit, Leaf (from the Asset Library)
devpost/             planning and submission documents
```

## How it was made
Planned with the Devpost learn-specs skill pack, built by Claude Code with the CLAD plugin and the Lens
Studio MCP, tested with LEAF. All audio is synthesised (Piper neural TTS for the narration; no human recordings, no voice cloning, no music).

## License
MIT — see [LICENSE](LICENSE). Packages under `Packages/` keep their own licenses (Snap Inc.).
