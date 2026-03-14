"use client";

import AvatarToggle from "@/components/AvatarToggle";
import { useDashboard } from "@/components/DashboardContext";
import DashboardMemberList from "@/components/DashboardMemberList";
import ExportButton from "@/components/ExportButton";
import FamilyTree from "@/components/FamilyTree";
import MindmapTree from "@/components/MindmapTree";
import RootSelector from "@/components/RootSelector";
import { Person, Relationship } from "@/types";
import { useMemo } from "react";

interface DashboardViewsProps {
  persons: Person[];
  relationships: Relationship[];
}

export default function DashboardViews({
  persons,
  relationships,
}: DashboardViewsProps) {
  const { view: currentView, rootId } = useDashboard();

  // Prepare map and roots for tree views
  const { personsMap, roots, defaultRootId } = useMemo(() => {
    const pMap = new Map<string, Person>();
    persons.forEach((p) => pMap.set(p.id, p));

    const childIds = new Set(
      relationships
        .filter(
          (r) => r.type === "biological_child" || r.type === "adopted_child",
        )
        .map((r) => r.person_b),
    );

    let finalRootId = rootId;

    // Track which people have any relationships (to filter out completely unlinked isolated nodes in "all" view)
    const hasRelationship = new Set<string>();
    const spouseBIds = new Set<string>(); // People added as "spouse" (person_b)

    // Build undirected graph to find connected components
    const adjacencyList = new Map<string, string[]>();
    const addEdge = (u: string, v: string) => {
      if (!adjacencyList.has(u)) adjacencyList.set(u, []);
      if (!adjacencyList.has(v)) adjacencyList.set(v, []);
      adjacencyList.get(u)!.push(v);
      adjacencyList.get(v)!.push(u);
    };

    relationships.forEach(r => {
      hasRelationship.add(r.person_a);
      hasRelationship.add(r.person_b);
      addEdge(r.person_a, r.person_b);

      if (r.type === 'marriage') {
        spouseBIds.add(r.person_b);
      }
    });

    // If no rootId is provided, fallback to the earliest created person (or "all")
    if (!finalRootId || (!pMap.has(finalRootId) && finalRootId !== "all")) {
      const rootsFallback = persons.filter((p) => !childIds.has(p.id) && !spouseBIds.has(p.id));
      if (rootsFallback.length > 0) {
        finalRootId = rootsFallback[0].id;
      } else if (persons.length > 0) {
        finalRootId = persons[0].id; // ultimate fallback
      }
    }

    let calculatedRoots: Person[] = [];
    if (finalRootId === "all") {
      // "Tổng quát" mode: Group all connected people into distinct families.
      // Pick EXACTLY ONE person per connected component as the root,
      // to avoid drawing overlapping trees for in-laws (e.g., both husband's dad and wife's mom as roots).

      const visited = new Set<string>();
      const components: string[][] = [];

      // Only iterate over people who actually have relationships
      persons.forEach(p => {
        if (!visited.has(p.id) && hasRelationship.has(p.id)) {
          const comp: string[] = [];
          const stack = [p.id];
          visited.add(p.id);

          while (stack.length > 0) {
            const current = stack.pop()!;
            comp.push(current);
            const neighbors = adjacencyList.get(current) || [];
            for (const n of neighbors) {
              if (!visited.has(n) && pMap.has(n)) {
                visited.add(n);
                stack.push(n);
              }
            }
          }
          if (comp.length > 0) {
            components.push(comp);
          }
        }
      });

      // For each connected family component, select the "best" root.
      // Best root: Person who is NOT a child of anyone, preferably NOT an added spouse, preferably Male (patriarch bias for standard trees)
      components.forEach(comp => {
        // Filter strictly to candidates who are NOT children in standard bloodlines
        let candidates = comp.filter(id => !childIds.has(id));

        // If everyone somehow is a child (circular/messy data), fallback to everyone in the component
        if (candidates.length === 0) candidates = comp;

        // Try to filter out added spouses (person_b in marriage) if we have other bloodline patriarchs
        const nonSpouseCandidates = candidates.filter(id => !spouseBIds.has(id));
        if (nonSpouseCandidates.length > 0) {
          candidates = nonSpouseCandidates;
        }

        // Prefer males if available
        const personCandidates = candidates.map(id => pMap.get(id)!).filter(Boolean);
        const maleCandidates = personCandidates.filter(p => p.gender === 'male');

        let chosenRoot: Person;
        if (maleCandidates.length > 0) {
          chosenRoot = maleCandidates[0];
        } else if (personCandidates.length > 0) {
          chosenRoot = personCandidates[0];
        } else {
          chosenRoot = pMap.get(comp[0])!;
        }

        calculatedRoots.push(chosenRoot);
      });

      if (calculatedRoots.length === 0 && persons.length > 0) {
        // Fallback: If absolutely everyone is unlinked, just show everyone
        calculatedRoots = persons;
      }
    } else if (finalRootId && pMap.has(finalRootId)) {
      calculatedRoots = [pMap.get(finalRootId)!];
    }

    return {
      personsMap: pMap,
      roots: calculatedRoots,
      defaultRootId: finalRootId,
    };
  }, [persons, relationships, rootId]);

  const activeRootId = rootId || defaultRootId;

  return (
    <>
      <main className="flex-1 overflow-auto bg-stone-50/50 flex flex-col">
        {currentView !== "list" && persons.length > 0 && activeRootId && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 w-full flex flex-wrap items-center justify-center gap-4 relative z-20">
            <RootSelector persons={persons} currentRootId={activeRootId} />
            <div className="flex items-center gap-2">
              <AvatarToggle />
              <ExportButton />
            </div>
          </div>
        )}

        {currentView === "list" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative z-10">
            <DashboardMemberList initialPersons={persons} />
          </div>
        )}

        <div className="flex-1 w-full relative z-10">
          {currentView === "tree" && (
            <FamilyTree
              personsMap={personsMap}
              relationships={relationships}
              roots={roots}
            />
          )}
          {currentView === "mindmap" && (
            <MindmapTree
              personsMap={personsMap}
              relationships={relationships}
              roots={roots}
            />
          )}
        </div>
      </main>
    </>
  );
}
