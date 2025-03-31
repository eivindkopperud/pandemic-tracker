// src/services/gistService.ts
import type { Card, GameState } from "../types/Card";

export type GistFileName = 'deck.json' | 'currentGame.json'
const GIST_ID = "38d66e7e0ebabeed12db7f2642b61db4";
const GITHUB_PAT = import.meta.env.VITE_GITHUB_PAT;

const API_HEADERS = {
  Authorization: `token ${GITHUB_PAT}`,
  "Content-Type": "application/json",
};

export const fetchGist = async (fileName: GistFileName): Promise<GameState | Card[]> => {
  const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: "GET",
    headers: API_HEADERS,
  });

  if (!response.ok) throw new Error("Failed to fetch gist");

  const data = await response.json();
  return JSON.parse(data.files[fileName].content);
};

export const saveGist = async (fileName: GistFileName, content: object): Promise<void> => {
  const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: "PATCH",
    headers: API_HEADERS,
    body: JSON.stringify({
      files: { [fileName]: { content: JSON.stringify(content) } },
    }),
  });

  if (!response.ok) throw new Error("Failed to save gist");
};
