import React from "react";
import ABCJS from "abcjs";
import Select from "react-select";
import { HexColorPicker } from "react-colorful";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Download,
  ExternalLink,
  Github,
  Info,
  MessageCircle,
  Palette,
  Settings,
  X,
} from "lucide-react";
import { createSong, getSong, listSongs, songFileURL } from "./api.js";
import { defaultSystemMessage } from "./data/defaultSystemMessage.js";
import { instruments } from "./data/instruments.js";

const palette = [
  "#F9D71C",
  "#87CEEB",
  "#50C878",
  "#E6E6FA",
  "#FFE5B4",
  "#FF7F50",
  "#98FF98",
  "#F4C2C2",
  "#FFA07A",
  "#C8A2C8",
];

const placeholders = [
  "Slow Donkey...",
  "Very Fast Monkey...",
  "Deep Reflection...",
  "Joyful times...",
  "Sad times...",
  "Tadadadada...",
  "Winter is coming...",
  "The sun is shining...",
  "The rain is falling...",
  "The wind is blowing...",
];

const defaultInstruments = [
  { name: "Yamaha Grand Piano", channel: 0 },
  { name: "Electric Piano", channel: 2 },
  { name: "Violin", channel: 40 },
  { name: "Cello", channel: 42 },
  { name: "Harp", channel: 46 },
  { name: "Clarinet", channel: 71 },
  { name: "Alto Sax", channel: 65 },
  { name: "Oboe", channel: 68 },
  { name: "Flute", channel: 73 },
];

const hashIndex = (value = "") =>
  [...value].reduce((total, char) => total + char.charCodeAt(0), 0) % palette.length;

const getComplementaryColor = (hexColor) => {
  const color = hexColor.replace("#", "");
  const r = parseInt(color.slice(0, 2), 16);
  const g = parseInt(color.slice(2, 4), 16);
  const b = parseInt(color.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
};

const randomHexColor = () =>
  `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, "0")}`;

const songBackground = (song) => {
  const hex = song?.prompt?.match(/#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/)?.[0];
  return hex || palette[hashIndex(song?.id)];
};

function App({ screen }) {
  return (
    <div className="app">
      <Header />
      {screen === "color" ? <ColorCreateScreen /> : null}
      {screen === "detail" ? <SongDetailScreen /> : null}
      {screen === "list" ? <SongListScreen /> : null}
      <Footer />
    </div>
  );
}

function Header() {
  const [aboutOpen, setAboutOpen] = React.useState(false);

  return (
    <header>
      <div className="topbar">
        <div className="topbar-inner">
          <div className="brand-cluster">
            <Link to="/songs/" className="brand" aria-label="SongGPT home">
              <span className="brand-mark" />
              <span>SongGPT.xyz</span>
            </Link>
            <button
              className="icon-chip"
              type="button"
              aria-label="What is SongGPT?"
              onClick={() => setAboutOpen(true)}
            >
              <Info size={15} />
            </button>
          </div>
          <a
            className="github-button"
            href="https://github.com/SoliMouse/songGPT"
            target="_blank"
            rel="noreferrer"
          >
            <Github size={18} />
            <span>Star on GitHub</span>
          </a>
        </div>
      </div>
      <div className="notice">
        <div className="topbar-inner">
          If you're having trouble with audio playback on your mobile device,
          try flipping the ringer switch to make sure it's not muted.
        </div>
      </div>
      <Modal open={aboutOpen} onClose={() => setAboutOpen(false)} title="What is songGPT?">
        <p>
          SongGPT is an experimental open-source project that explores the
          potential of Language Models in generating original and customizable
          musical compositions. You can read more about it on our GitHub page.
        </p>
      </Modal>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <a href="https://discord.gg/ArjurfDCCy" target="_blank" rel="noreferrer">
        Join our Discord
      </a>
      <p>
        Made with love by{" "}
        <a href="https://twitter.com/Tanovski" target="_blank" rel="noreferrer">
          Jeffry
        </a>
        ,{" "}
        <a href="https://twitter.com/_xSoli" target="_blank" rel="noreferrer">
          Soli
        </a>
        ,{" "}
        <a
          href="https://www.linkedin.com/in/hatem-soliman-12908a1b3/"
          target="_blank"
          rel="noreferrer"
        >
          Tommy
        </a>{" "}
        &{" "}
        <a
          href="https://www.linkedin.com/in/justin-dorber-370581130/"
          target="_blank"
          rel="noreferrer"
        >
          Justin
        </a>
      </p>
    </footer>
  );
}

function SongListScreen() {
  const songs = useQuery({
    queryKey: ["songs"],
    queryFn: () => listSongs({ limit: 6 }),
  });

  return (
    <main className="screen">
      <section className="song-rail" aria-label="Generated examples">
        {songs.isLoading ? <SongSkeletons /> : null}
        {songs.data?.songs?.length ? (
          <div className="rail-scroll">
            {songs.data.songs.map((song) => (
              <SongCard key={song.id} song={song} compact />
            ))}
          </div>
        ) : null}
        {!songs.isLoading && !songs.data?.songs?.length ? (
          <p className="empty-state">Generated songs will appear here.</p>
        ) : null}
      </section>
      <SongCreate />
    </main>
  );
}

function SongDetailScreen() {
  const { songID } = useParams();
  const song = useQuery({
    queryKey: ["song", songID],
    queryFn: () => getSong(songID),
    enabled: Boolean(songID),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "queued" || status === "processing" ? 3500 : false;
    },
  });

  return (
    <main className="screen detail-screen">
      <section className="detail-card-wrap">
        {song.isLoading ? <div className="detail-skeleton" /> : null}
        {song.data ? <SongCard song={song.data} /> : null}
      </section>
      <section className="detail-compose">
        <SongCreate initialSystemMessage={song.data?.system_message || defaultSystemMessage} />
        <Link className="examples-link" to="/songs/">
          See Examples
        </Link>
      </section>
    </main>
  );
}

function ColorCreateScreen() {
  const [color, setColor] = React.useState(() => randomHexColor());
  const [systemMessage, setSystemMessage] = React.useState(defaultSystemMessage);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const complementary = getComplementaryColor(color);
  const mutation = useMutation({
    mutationFn: createSong,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["songs"] });
      navigate(`/songs/${data.id}/`);
    },
  });

  return (
    <main className="color-screen" style={{ backgroundColor: color, color: complementary }}>
      <HexColorPicker color={color} onChange={setColor} />
      <InstrumentList systemMessage={systemMessage} setSystemMessage={setSystemMessage} />
      <button
        className="generate-button color-generate"
        type="button"
        disabled={mutation.isPending}
        onClick={() =>
          mutation.mutate({
            prompt: `Color (hexcode): ${color}`,
            system_message: systemMessage,
          })
        }
        style={{ color: complementary, borderColor: complementary }}
      >
        {mutation.isPending ? "Generating..." : "Generate"}
      </button>
      {mutation.isPending ? (
        <p className="loading-note" style={{ color: complementary }}>
          This normally takes less than 60 seconds
        </p>
      ) : null}
      {mutation.error ? <p className="error-note">{mutation.error.message}</p> : null}
    </main>
  );
}

function SongCreate({ initialSystemMessage = defaultSystemMessage }) {
  const [prompt, setPrompt] = React.useState("");
  const [systemMessage, setSystemMessage] = React.useState(initialSystemMessage);
  const placeholder = React.useMemo(
    () => placeholders[Math.floor(Math.random() * placeholders.length)],
    [],
  );
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createSong,
    onSuccess: (data) => {
      setPrompt("");
      queryClient.invalidateQueries({ queryKey: ["songs"] });
      navigate(`/songs/${data.id}/`);
    },
  });

  return (
    <section className="composer" aria-label="Create a song">
      <InstrumentList systemMessage={systemMessage} setSystemMessage={setSystemMessage} />
      <div className="prompt-shell">
        <SettingsModal systemMessage={systemMessage} setSystemMessage={setSystemMessage} />
        <textarea
          value={prompt}
          maxLength={1000}
          rows={4}
          placeholder={placeholder}
          onChange={(event) => setPrompt(event.target.value)}
          aria-label="Song prompt"
        />
        <Link className="palette-button" to="/songs/create/" aria-label="Create from color">
          <Palette size={20} />
        </Link>
      </div>
      <p className="hint">
        Paste your favorite quote or poem and let our language model generate a
        beautiful and original piece of music for you.
      </p>
      <button
        className="generate-button"
        type="button"
        disabled={!prompt || mutation.isPending}
        onClick={() => mutation.mutate({ prompt, system_message: systemMessage })}
      >
        {mutation.isPending ? "Generating..." : "Generate"}
      </button>
      {mutation.isPending ? (
        <p className="loading-note">This normally takes less than 60 seconds</p>
      ) : null}
      {mutation.error ? <p className="error-note">{mutation.error.message}</p> : null}
    </section>
  );
}

function InstrumentList({ systemMessage, setSystemMessage }) {
  const [selectedInstruments, setSelectedInstruments] =
    React.useState(defaultInstruments);

  const options = React.useMemo(
    () =>
      instruments.map((instrument) => ({
        value: instrument.name,
        label: instrument.name,
        channel: instrument.channel,
      })),
    [],
  );

  React.useEffect(() => {
    const instrumentText = selectedInstruments
      .map((instrument) => `${instrument.name} (${instrument.channel})`)
      .join(", ");
    setSystemMessage(
      systemMessage.replace(/Instruments:[^.]*\./, `Instruments: ${instrumentText}.`),
    );
  }, [selectedInstruments]);

  return (
    <Select
      className="instrument-select"
      classNamePrefix="instrument"
      isMulti
      isClearable={false}
      options={options}
      value={selectedInstruments.map((instrument) => ({
        value: instrument.name,
        label: instrument.name,
        channel: instrument.channel,
      }))}
      onChange={(selected) => {
        if (selected?.length) {
          setSelectedInstruments(
            selected.map((option) => ({
              name: option.value,
              channel: option.channel,
            })),
          );
        }
      }}
      placeholder="Select instruments..."
      styles={{
        control: (base) => ({
          ...base,
          minWidth: 250,
          borderWidth: 0,
          boxShadow: "none",
          backgroundColor: "transparent",
        }),
        menu: (base) => ({
          ...base,
          zIndex: 20,
          padding: 5,
          opacity: 0.96,
          backdropFilter: "blur(25px)",
        }),
        multiValue: (base) => ({
          ...base,
          opacity: 0.58,
          backgroundColor: "#d5dee8",
        }),
        multiValueLabel: (base) => ({
          ...base,
          padding: 8,
          color: "#111827",
        }),
        multiValueRemove: (base) => ({
          ...base,
          cursor: "pointer",
          color: "#111827",
          ":hover": {
            color: "#111827",
            backgroundColor: "transparent",
          },
        }),
      }}
    />
  );
}

function SettingsModal({ systemMessage, setSystemMessage }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        className="prompt-icon"
        type="button"
        aria-label="Prompt settings"
        onClick={() => setOpen(true)}
      >
        <Settings size={18} />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Prompt Engineering">
        <p className="modal-copy">
          We pass the prompt below to the composer before sending your input.
          We still haven't found the optimal prompt so feel free to modify this
          one and have some fun with it.
        </p>
        <textarea
          className="settings-textarea"
          rows={12}
          value={systemMessage}
          maxLength={2500}
          onChange={(event) => setSystemMessage(event.target.value)}
        />
        {systemMessage !== defaultSystemMessage ? (
          <button
            className="reset-button"
            type="button"
            onClick={() => setSystemMessage(defaultSystemMessage)}
          >
            Reset
          </button>
        ) : null}
      </Modal>
    </>
  );
}

function SongCard({ song, compact = false }) {
  const [responseOpen, setResponseOpen] = React.useState(false);
  const [downloadOpen, setDownloadOpen] = React.useState(false);
  const background = songBackground(song);
  const foreground = getComplementaryColor(background);
  const abc = song?.abc?.replace(/(%%MIDI program)\s+\d+\s+(\d+)/g, "$1 $2");

  return (
    <article
      className={`song-card ${compact ? "compact" : ""}`}
      style={{ backgroundColor: background, color: foreground }}
    >
      <div className="song-actions">
        <Link
          className="song-icon"
          to={`/songs/${song.id}/`}
          style={{ color: foreground }}
          aria-label="Open song"
        >
          <ExternalLink size={22} />
        </Link>
        <div className="download-wrap">
          <button
            className="song-icon"
            type="button"
            style={{ color: foreground }}
            aria-label="Download song files"
            onClick={() => setDownloadOpen((value) => !value)}
          >
            <Download size={22} />
          </button>
          {downloadOpen ? <DownloadMenu songID={song.id} /> : null}
        </div>
        <button
          className="song-icon"
          type="button"
          style={{ color: foreground }}
          aria-label="Open composer response"
          onClick={() => setResponseOpen(true)}
        >
          <MessageCircle size={22} />
        </button>
      </div>
      {song.status !== "complete" ? <SongStatus song={song} /> : null}
      {abc && song.status === "complete" ? <ABCAudioPlayer abc={abc} color={foreground} /> : null}
      <Modal
        open={responseOpen}
        onClose={() => setResponseOpen(false)}
        title="Composer response"
      >
        <pre className="response-text">
          {song.prompt}
          {"\n\n"}
          {song.response || song.abc || song.error || "No response yet."}
        </pre>
      </Modal>
    </article>
  );
}

function SongStatus({ song }) {
  const label =
    song.status === "queued"
      ? "Queued for the composer"
      : song.status === "processing"
        ? "The composer is writing this one"
        : song.status === "failed"
          ? song.error || "Generation failed"
          : "Waiting for audio";
  return (
    <div className="song-status">
      <span>{label}</span>
    </div>
  );
}

function DownloadMenu({ songID }) {
  return (
    <div className="download-menu">
      <span>Download</span>
      <a href={songFileURL(songID, "abc")}>ABC</a>
      <a href={songFileURL(songID, "mid")}>MIDI</a>
    </div>
  );
}

function ABCAudioPlayer({ abc, color = "#ffffff" }) {
  const notationRef = React.useRef(null);
  const audioRef = React.useRef(null);

  React.useEffect(() => {
    if (!notationRef.current || !audioRef.current || !abc) return undefined;
    notationRef.current.innerHTML = "";
    audioRef.current.innerHTML = "";
    const visualObj = ABCJS.renderAbc(notationRef.current, abc, {
      staffwidth: 740,
      add_classes: true,
      responsive: "resize",
    });
    const synthController = new ABCJS.synth.SynthController();
    synthController.load(audioRef.current, null, {
      displayPlay: true,
      displayLoop: false,
      displayRestart: false,
      displayProgress: true,
      displayWarp: true,
    });
    const midiBuffer = new ABCJS.synth.CreateSynth();
    midiBuffer
      .init({ visualObj: visualObj[0] })
      .then(() => synthController.setTune(visualObj[0], false))
      .catch((error) => console.warn("Audio problem:", error));
    return () => {
      notationRef.current && (notationRef.current.innerHTML = "");
      audioRef.current && (audioRef.current.innerHTML = "");
    };
  }, [abc]);

  return (
    <div className={`abc-player ${color !== "#ffffff" ? "inverse" : ""}`}>
      <div ref={notationRef} className="abcjs-container" style={{ color }} />
      <div ref={audioRef} className="abcjs-audio" style={{ color }} />
    </div>
  );
}

function Modal({ open, onClose, title, children }) {
  React.useEffect(() => {
    if (!open) return undefined;
    const handler = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <h2>{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}

function SongSkeletons() {
  return (
    <div className="rail-scroll">
      {[1, 2, 3, 4, 5].map((item) => (
        <div className="song-skeleton" key={item} />
      ))}
    </div>
  );
}

export default App;
