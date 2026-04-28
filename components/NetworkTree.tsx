"use client";

import React, { useEffect, useMemo } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  MiniMap,
  Controls,
  Background,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react';
import dagre from 'dagre';
import { Person, Relationship } from '@/types';

const nodeWidth = 180;
const nodeHeight = 60;

const CustomNode = ({ data }: any) => {
  return (
    <div style={data.style} className="relative group">
      <Handle type="target" position={Position.Top} id="top" className="opacity-0 w-full" />
      <Handle type="source" position={Position.Right} id="right" className="opacity-0 h-full !right-0" />
      <Handle type="target" position={Position.Left} id="left" className="opacity-0 h-full !left-0" />
      {data.label}
      <Handle type="source" position={Position.Bottom} id="bottom" className="opacity-0 w-full" />
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

const getLayoutedElements = (personsMap: Map<string, Person>, relationships: Relationship[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, align: 'UL', nodesep: 60, ranksep: 100, edgesep: 30 });

  const initialNodes = Array.from(personsMap.values()).map(person => ({
    id: person.id,
    type: 'custom',
    data: { 
      label: person.full_name,
      style: {
        background: person.gender === 'male' ? '#e0f2fe' : person.gender === 'female' ? '#ffe4e6' : '#f5f5f4',
        border: '1px solid #d6d3d1',
        borderRadius: '8px',
        padding: '10px',
        fontWeight: 'bold',
        color: '#1c1917',
        width: nodeWidth,
        textAlign: 'center' as const
      }
    },
    position: { x: 0, y: 0 },
  }));

  // Add logical nodes to Dagre
  initialNodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  // Calculate distinct edge groups
  const marriageEdges = relationships.filter(r => r.type === 'marriage' && personsMap.has(r.person_a) && personsMap.has(r.person_b));
  const biologicalEdges = relationships.filter(r => r.type !== 'marriage' && personsMap.has(r.person_a) && personsMap.has(r.person_b));

  // ONLY biological edges go to Dagre to enforce vertical hierarchy!
  biologicalEdges.forEach((edge) => {
    dagreGraph.setEdge(edge.person_a, edge.person_b);
  });

  // Layout logically
  dagre.layout(dagreGraph);

  // Apply positions with layout fallback
  const newNodes = initialNodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id) || { x: Math.random() * 200, y: Math.random() * 200 };
    const newNode = { ...node };
    newNode.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    return newNode;
  });

  // Determine which marriages have which children to route lines from famNode.
  const parentToMarriages = new Map<string, string[]>();
  marriageEdges.forEach(m => {
     if (!parentToMarriages.has(m.person_a)) parentToMarriages.set(m.person_a, []);
     if (!parentToMarriages.has(m.person_b)) parentToMarriages.set(m.person_b, []);
     parentToMarriages.get(m.person_a)!.push(m.id);
     parentToMarriages.get(m.person_b)!.push(m.id);
  });

  const finalEdges: any[] = [];
  const finalNodes = [...newNodes];

  // Post-process to align spouses and insert fam invisible nodes
  marriageEdges.forEach((edge) => {
    const srcNode = finalNodes.find(n => n.id === edge.person_a);
    const tgtNode = finalNodes.find(n => n.id === edge.person_b);
    if (srcNode && tgtNode) {
      // Pull onto the same rank (Y-plane)
      const targetY = Math.max(srcNode.position.y, tgtNode.position.y);
      srcNode.position.y = targetY;
      tgtNode.position.y = targetY;

      // Close horizontal gap if Dagre separated them too much
      const x1 = srcNode.position.x;
      const x2 = tgtNode.position.x;
      if (Math.abs(x1 - x2) > nodeWidth * 1.5) {
        tgtNode.position.x = x1 + nodeWidth + 60; // Standard spacing
      }

      // Order left-to-right (Husband usually left, but we just use positions)
      const leftNode = srcNode.position.x <= tgtNode.position.x ? srcNode : tgtNode;
      const rightNode = leftNode === srcNode ? tgtNode : srcNode;

      // 1. Create invisible Fam node precisely at the center between them
      const famId = `fam_${edge.id}`;
      finalNodes.push({
        id: famId,
        type: 'custom',
        data: { label: '', style: { width: '1px', height: '1px', padding: '0px', border: 'none', background: 'transparent' } },
        position: {
          x: leftNode.position.x + nodeWidth + ((rightNode.position.x - (leftNode.position.x + nodeWidth)) / 2),
          y: targetY + (nodeHeight / 2),
        }
      });

      // 2. Visual Edges: [Left Node] -> [Fam Node] -> [Right Node]
      finalEdges.push({
        id: `m_L_${edge.id}`,
        source: leftNode.id,
        target: famId,
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'straight',
        style: { stroke: '#1c1917', strokeWidth: 1.5 },
      });
      finalEdges.push({
        id: `m_R_${edge.id}`,
        source: famId,
        target: rightNode.id,
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'straight',
        style: { stroke: '#1c1917', strokeWidth: 1.5 },
      });
    }
  });

  // Calculate visual biological edges
  const renderedChildToFam = new Set<string>();
  biologicalEdges.forEach(c => {
    const parentId = c.person_a;
    const childId = c.person_b;
    
    // Check if this child connects to a family node instead of individual parent
    let sharedMarriageId = null;
    const marriageIdsForParent = parentToMarriages.get(parentId) || [];
    for (const mId of marriageIdsForParent) {
      const m = marriageEdges.find(ms => ms.id === mId);
      if (!m) continue;
      const otherSpouseId = m.person_a === parentId ? m.person_b : m.person_a;
      
      const isShared = biologicalEdges.some(ce => ce.person_a === otherSpouseId && ce.person_b === childId);
      if (isShared) {
        sharedMarriageId = m.id;
        break;
      }
    }

    if (sharedMarriageId) {
      const edgeKey = `fam_${sharedMarriageId}_${childId}`;
      if (!renderedChildToFam.has(edgeKey)) {
        renderedChildToFam.add(edgeKey);
        finalEdges.push({
          id: `child_${edgeKey}`,
          source: `fam_${sharedMarriageId}`,
          target: childId,
          sourceHandle: 'bottom',
          targetHandle: 'top',
          type: 'smoothstep', // 'smoothstep' draws orthogonal lines (down-across-down) standard for trees
          style: { stroke: '#1c1917', strokeWidth: 1.5 },
        });
      }
    } else {
      // Single parent edge
      finalEdges.push({
        id: `child_${parentId}_${childId}`,
        source: parentId,
        target: childId,
        sourceHandle: 'bottom',
        targetHandle: 'top',
        type: 'smoothstep',
        style: { stroke: '#1c1917', strokeWidth: 1.5 },
      });
    }
  });

  return { nodes: finalNodes, edges: finalEdges };
};

export default function NetworkTree({
  personsMap,
  relationships,
}: {
  personsMap: Map<string, Person>;
  relationships: Relationship[];
}) {
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(personsMap, relationships),
    [personsMap, relationships]
  );

  return (
    <div className="w-full h-[70vh] bg-stone-50/50 rounded-2xl border border-stone-200 overflow-hidden relative shadow-inner">
      <div className="absolute top-2 right-2 z-50 bg-black/80 text-white p-2 rounded text-xs font-mono">
        DEBUG: personsMap={personsMap.size}, layoutedNodes={layoutedNodes.length}, edges={layoutedEdges.length}
      </div>
      <ReactFlow
        nodes={layoutedNodes}
        edges={layoutedEdges}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Controls />
        <MiniMap zoomable pannable nodeColor={(n) => {
          if (n.style?.background === '#e0f2fe') return '#38bdf8';
          if (n.style?.background === '#ffe4e6') return '#fb7185';
          return '#a8a29e';
        }} />
        <Background gap={16} size={1} />
      </ReactFlow>
      
      <div className="absolute top-4 left-4 bg-white/80 backdrop-blur text-xs p-3 rounded-lg border border-stone-200 shadow-sm pointer-events-none">
        <h4 className="font-bold text-stone-700 mb-2">Chú giải</h4>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 bg-[#e0f2fe] border border-stone-300 rounded-sm"></div>
          <span>Nam</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 bg-[#ffe4e6] border border-stone-300 rounded-sm"></div>
          <span>Nữ</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 border-t-2 border-stone-400"></div>
          <span>Cha mẹ - Con</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 border-t-2 border-amber-500 border-dashed"></div>
          <span>Vợ chồng</span>
        </div>
      </div>
    </div>
  );
}
