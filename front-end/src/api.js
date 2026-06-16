const API_BASE = "/api";

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Request failed with ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
};

export const listSongs = ({ limit = 6, offset = 0 } = {}) =>
  request(`/songs/?limit=${limit}&offset=${offset}`);

export const getSong = (songID) => request(`/songs/${songID}`);

export const createSong = (payload) =>
  request("/songs/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const songFileURL = (songID, type) =>
  `${API_BASE}/songs/${songID}/files/${type}`;
