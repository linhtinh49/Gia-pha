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
      <Handle type="target" position={Position.Top} className="opacity-0 w-full" />
      <Handle type="source" position={Position.Right} id="right" className="opacity-0 h-full !right-0" />
      <Handle type="target" position={Position.Left} id="left" className="opacity-0 h-full !left-0" />
      {data.label}
      <Handle type="source" position={Position.Bottom} className="opacity-0 w-full" />
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, align: 'UL', nodesep: 60, ranksep: 100, edgesep: 30 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    // Only pass biological relationships to Dagre to enforce vertical rank.
    // Marriages are excluded from Dagre so spouses are placed at the same rank.
    if (edge.type !== 'straight') {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id) || { x: Math.random() * 200, y: Math.random() * 200 };
    const newNode = { ...node };

    newNode.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return newNode;
  });

  // Post-process to align spouses exactly and pull disconnected spouses together
  edges.forEach((edge) => {
    if (edge.type === 'straight') {
      const srcNode = newNodes.find(n => n.id === edge.source);
      const tgtNode = newNodes.find(n => n.id === edge.target);
      if (srcNode && tgtNode) {
        // Enforce same Y coordinate (take the maximum Y, pushing them down together)
        const targetY = Math.max(srcNode.position.y || 0, tgtNode.position.y || 0);
        srcNode.position.y = targetY;
        tgtNode.position.y = targetY;

        // Ensure they are close horizontally if dagre placed them far apart
        // Typically dagre nodesep is 60, nodeWidth is 180.
        // We can optionally pull tgtNode next to srcNode if they are too far
        const xDist = Math.abs(srcNode.position.x - tgtNode.position.x);
        if (xDist > nodeWidth * 2) {
           // Basic heuristic pulling:
           tgtNode.position.x = srcNode.position.x + nodeWidth + 60;
        }
      }
    }
  });

  return { nodes: newNodes, edges };
};

export default function NetworkTree({
  personsMap,
  relationships,
}: {
  personsMap: Map<string, Person>;
  relationships: Relationship[];
}) {
  const initialNodes = useMemo(() => {
    return Array.from(personsMap.values()).map(person => ({
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
  }, [personsMap]);

  const initialEdges = useMemo(() => {
    return relationships
      .filter(r => personsMap.has(r.person_a) && personsMap.has(r.person_b))
      .map(r => {
        if (r.type === 'marriage') {
          return {
            id: r.id,
            source: r.person_a,
            target: r.person_b,
            sourceHandle: 'right', // line starts from right side of husband
            targetHandle: 'left', // line ends at left side of wife
            type: 'straight',
            style: { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5,5' },
            animated: true,
            labelStyle: { fill: '#b45309', fontWeight: 700, fontSize: 10 },
          };
        } else {
          return {
            id: r.id,
            source: r.person_a,
            target: r.person_b,
            type: 'smoothstep',
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#a8a29e',
            },
            style: { stroke: '#a8a29e', strokeWidth: 2 },
          };
        }
      });
  }, [relationships, personsMap]);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(initialNodes, initialEdges),
    [initialNodes, initialEdges]
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
