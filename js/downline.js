const BASE_URL = 'https://dear-smith-web.onrender.com'

const YOUR_LIFF_ID_HOMEPAGE = '2007882928-Avj6QNZW'
const YOUR_LIFF_ID_SHARE = '2007882928-a6n8BlA9'
const YOUR_LIFF_ID_REGISTER = '2007882928-VWgW2jYN'
const YOUR_LIFF_ID_DOWNLINE = '2007882928-dgJE2Kl4'

const API_PATH = (userId) => `${BASE_URL}/api/downline/${userId}`;

// Fallback sample (กรณี API ล่ม/ยังไม่พร้อม)
const sample = {
    "user_id": 1, "name": "Somchai Dee", "children": [
        {
            "user_id": 2, "name": "Suda Jai", "children": [
                { "user_id": 4, "name": "Mali Rak", "children": [] }
            ]
        },
        {
            "user_id": 3, "name": "Anan Boon", "children": [
                { "user_id": 5, "name": "Krit Wong", "children": [] }
            ]
        }
    ]
};

const chartEl = document.getElementById("chart");
let svg, gLinks, gNodes, root, treeLayout, diagonal;
let allNodesFlat = []; // ไว้ใช้ expand/collapse ทั้งหมด

// สร้าง SVG + groups
function initChart() {
    chartEl.innerHTML = "";
    svg = d3.select("#chart").append("svg");
    const g = svg.append("g").attr("transform", "translate(40,20)");
    gLinks = g.append("g").attr("class", "links");
    gNodes = g.append("g").attr("class", "nodes");

    // Layout แนวนอน (x=ยืน, y=นอน)
    treeLayout = d3.tree().nodeSize([56, 160]); // ช่องไฟแนวตั้ง, แนวนอน
    diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);

    // ทำให้ zoom/drag ได้
    svg.call(
        d3.zoom().scaleExtent([0.5, 2]).on("zoom", (e) => {
            g.attr("transform", e.transform);
        })
    );
}

// เปลี่ยน / อัปเดตภาพ
function update(source) {
    // สร้างโครงข้อมูล d3 hierarchy
    root.x0 ??= 0; root.y0 ??= 0;
    const nodes = root.descendants();
    const links = root.links();

    // คำนวณตำแหน่ง
    treeLayout(root);

    // ===== Links
    const link = gLinks.selectAll("path.link").data(links, d => d.target.data.user_id);
    link.enter().append("path")
        .attr("class", "link")
        .attr("d", d => diagonal({ source: { x: source.x0, y: source.y0 }, target: { x: source.x0, y: source.y0 } }))
        .merge(link)
        .transition().duration(300)
        .attr("d", d => diagonal({ source: d.source, target: d.target }));
    link.exit().transition().duration(300)
        .attr("d", d => diagonal({ source: { x: source.x, y: source.y }, target: { x: source.x, y: source.y } }))
        .remove();

    // ===== Nodes
    const node = gNodes.selectAll("g.node").data(nodes, d => d.data.user_id);

    const nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${source.y0},${source.x0})`)
        .on("click", (_, d) => {
            toggle(d);
            update(d);
        });

    nodeEnter.append("circle").attr("r", 16);
    nodeEnter.append("text")
        .attr("dy", "0")
        .attr("x", 24)
        .text(d => d.data.name);

    const nodeUpdate = nodeEnter.merge(node);
    nodeUpdate.transition().duration(300)
        .attr("transform", d => `translate(${d.y},${d.x})`);

    const nodeExit = node.exit().transition().duration(300)
        .attr("transform", d => `translate(${source.y},${source.x})`)
        .remove();

    // เก็บตำแหน่งเก่าไว้สำหรับ animation รอบถัดไป
    nodes.forEach(d => { d.x0 = d.x; d.y0 = d.y; });

    // ปรับขนาด svg ให้พอดีกับ content โดยประมาณ (เพิ่ม margin)
    const bounds = gNodes.node().getBBox();
    const pad = 100;
    svg.attr("viewBox", `${Math.min(0, bounds.x) - pad} ${Math.min(0, bounds.y) - pad} ${Math.max(bounds.width + pad * 2, chartEl.clientWidth)} ${Math.max(bounds.height + pad * 2, chartEl.clientHeight)}`);
}

// พับ/กาง โหนด (เก็บ children ไว้ที่ _children)
function toggle(d) {
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else {
        d.children = d._children;
        d._children = null;
    }
}

// พับทั้งหมด (ยกเว้น root)
function collapseAll() {
    allNodesFlat.forEach(n => {
        if (n !== root) { n._children = n.children; n.children = null; }
    });
    update(root);
}

// กางทั้งหมด
function expandAll() {
    allNodesFlat.forEach(n => {
        if (n._children) { n.children = n._children; n._children = null; }
    });
    update(root);
}

// โหลดข้อมูลจาก API → วาดกราฟ
async function loadAndRender(userId) {
    initChart();
    let data;
    try {
        const { data: resp } = await axios.get(API_PATH(userId));
        data = resp && Object.keys(resp).length ? resp : sample;
    } catch (e) {
        console.warn("API error, using sample data:", e?.message);
        data = sample;
    }

    // สร้าง root hierarchy
    root = d3.hierarchy(data);
    root.x0 = 0; root.y0 = 0;

    // เก็บ flat nodes ไว้ใช้งานปุ่มพับ/กาง
    allNodesFlat = root.descendants();

    // เริ่มต้น: พับเลเวลลึกกว่า 1 (เหลือลูกตรงของ root)
    allNodesFlat.forEach(d => {
        if (d.depth > 1 && d.children) { d._children = d.children; d.children = null; }
    });

    update(root);
}

// Events
document.getElementById("loadBtn").addEventListener("click", () => {
    const id = parseInt(document.getElementById("userIdInput").value || "1", 10);
    loadAndRender(id);
});
document.getElementById("expandBtn").addEventListener("click", expandAll);
document.getElementById("collapseBtn").addEventListener("click", collapseAll);

// เริ่มโหลด root = 1 ครั้งแรก
loadAndRender(1);