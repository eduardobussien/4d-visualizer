const TEMPLATE = `
  <div class="intro">
    <section class="intro-hero">
      <h1>Seeing the Fourth Dimension</h1>
      <p class="intro-sub">
        An intuition-first tool for perceiving 4D shapes. 4D is impossible to
        see directly, but the intuition for it can be built up step by step.
      </p>
      <a href="#flatland" class="intro-cta">Start with Flatland &rarr;</a>
    </section>

    <section class="intro-block">
      <h2>How to explore</h2>
      <p class="intro-lead">
        The tabs above are meant to be visited in order, left to right. Each
        one borrows the idea from the one before it and applies it one
        dimension higher.
      </p>
      <ol class="intro-tabs">
        <li>
          <strong>Flatland.</strong> A 3D shape passes through a 2D plane. A
          flat being living in that plane only ever sees the slice: a circle,
          a square, growing and shrinking. The 3D view shows the whole story.
          This is the trick, one dimension down.
        </li>
        <li>
          <strong>Build &amp; Raise.</strong> Pick a 2D shape or draw a new
          one. The same operation that lifts a flat polygon into a 3D solid
          takes that 3D solid into a 4D one. Two takes, no new magic.
        </li>
        <li>
          <strong>Tesseract.</strong> Now a real 4D shape passing through 3D
          space. The slice morphs through a sequence of polyhedra as the
          shape rotates. That morphing is the 4D experience for a 3D being.
        </li>
        <li>
          <strong>Projection.</strong> The other way to render 4D: a "shadow"
          in 3D. Hue encodes the W coordinate the projection threw away.
          The classic cube-in-a-cube tesseract, but grounded.
        </li>
        <li>
          <strong>Playground.</strong> Everything together. Four 4D shapes,
          slice or shadow, all six rotation planes on separate sliders. Free
          exploration lives here.
        </li>
      </ol>
    </section>

    <section class="intro-block">
      <h2>Why this project</h2>
      <p>
        Most 4D visualizers open with a rotating tesseract and expect
        comprehension to follow. That shows the last step of understanding
        first. This project builds the intuition in layers, borrowing the
        cross-section trick from Flatland and generalizing it upward, so the
        tesseract at the end actually makes sense instead of just looking
        cool.
      </p>
    </section>
  </div>
`;

export function mountIntro(root: HTMLElement): () => void {
  root.innerHTML = TEMPLATE;
  return () => {
    root.innerHTML = '';
  };
}
