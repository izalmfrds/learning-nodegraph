# Improve Graph View

Redesign the Graph View to feel like Obsidian while keeping the existing application layout.

## Canvas

Replace the current solid black background.

Use a light canvas:

Background: #F7F8FA

Render an infinite dotted background similar to Figma.

Dot color:

#D9DDE5

Dot size:

2px

Spacing:

24px

The dot grid should move together with the graph while panning and zooming.

---

## Graph Rendering

Continue using `force-graph`.

Use custom rendering with `nodeCanvasObject()`.

Use the implementation below as the starting reference and adapt it into the existing React/Next.js component instead of creating a standalone HTML page.

```javascript
const Graph = ForceGraph()(containerRef.current)
  .graphData(graphData)
  .nodeId('id')
  .nodeAutoColorBy('group')

  .linkColor(() => '#CBD5E1')
  .linkWidth(1.5)

  .nodeCanvasObject((node, ctx, globalScale) => {
    const label = node.id;
    const fontSize = 12 / globalScale;

    ctx.font = `${fontSize}px Inter`;

    // Node shadow
    ctx.shadowColor = 'rgba(0,0,0,0.12)';
    ctx.shadowBlur = 10;

    // White outline
    ctx.beginPath();
    ctx.arc(node.x, node.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = node.color;
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Reset shadow
    ctx.shadowBlur = 0;

    // Label
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#374151';
    ctx.fillText(label, node.x, node.y - 16);
  })

  .linkDirectionalParticles(2)
  .linkDirectionalParticleSpeed(0.005)
  .linkDirectionalParticleWidth(2)
  .linkDirectionalParticleColor(() => '#8B5CF6');
```

---

## Node Interaction

Hover

- slightly enlarge node
- show pointer cursor
- highlight connected links

Selected

- add purple glow
- enlarge node
- dim unrelated nodes

---

## Labels

Hide labels when zoomed far out.

Show labels again when zoomed in.

---

## Camera

Support

- Pan
- Zoom
- Mouse wheel
- Trackpad gesture
- Double click to focus node

---

## Keep Existing Layout

Do NOT redesign:

- Sidebar
- Header
- Toolbar

Only improve the graph canvas and rendering.

The result should feel similar to:

- Obsidian Graph View
- Figma infinite canvas
- Modern knowledge graph visualization