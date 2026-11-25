import { describe, expect, it } from "vitest";
import { decodeSignal, encodeSignal, type RadarSignal } from "../../src/models/signal";
import { User } from "../../src/models/user";
import { getRadarMessageLength } from "../../src/models/buildings";

const SIGNAL: Omit<RadarSignal, "id"> = {
  planetName: "Velgol II",
  planetSeed: "velgol",
  planetKind: "ocean",
  authorName: "Lia Ferral",
  authorTitle: "Ingénieure",
  authorSeed: "lia-seed",
  message: "Bonjour, voisins ! On a réparé le réacteur 🚀 — à bientôt.",
  sentAt: 1_795_000_000_000,
  score: 1234,
};

describe("radar signals", () => {
  it("survives a round trip, accents and emojis included", () => {
    const code = encodeSignal(SIGNAL);
    expect(code).toMatch(/^OFFLINER1\.[A-Za-z0-9_-]+\.[0-9a-z]+$/);
    const decoded = decodeSignal(code);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) expect(decoded.signal).toMatchObject(SIGNAL);
  });

  it("reads codes made before scores existed", () => {
    const code = encodeSignal({ ...SIGNAL, score: null });
    const decoded = decodeSignal(code);
    expect(decoded.ok && decoded.signal.score).toBeNull();
  });

  it("ignores spaces and line breaks added on the way", () => {
    const code = encodeSignal(SIGNAL);
    const wrapped = `  ${code.slice(0, 20)}\n${code.slice(20, 50)} ${code.slice(50)}\n`;
    expect(decodeSignal(wrapped).ok).toBe(true);
  });

  it("tells a damaged code from something that is not a signal", () => {
    const code = encodeSignal(SIGNAL);
    expect(decodeSignal("bonjour")).toEqual({ ok: false, error: "format" });
    expect(decodeSignal(code.replace("OFFLINER1", "OFFLINER2"))).toEqual({ ok: false, error: "version" });
    // One character changed, or the end cut off.
    const middle = Math.floor(code.length / 2);
    const altered = code.slice(0, middle) + (code[middle] === "A" ? "B" : "A") + code.slice(middle + 1);
    expect(decodeSignal(altered)).toEqual({ ok: false, error: "checksum" });
    const [head, body, sum] = code.split(".");
    expect(decodeSignal(`${head}.${body.slice(0, -4)}.${sum}`)).toEqual({ ok: false, error: "checksum" });
  });

  it("rejects a well-formed code whose content is not a signal", () => {
    const forged = encodeSignal({ ...SIGNAL, message: "   " });
    expect(decodeSignal(forged)).toEqual({ ok: false, error: "content" });
  });

  it("emits from a planet with a radar, signed by a known inhabitant", () => {
    const user = new User("Joueur", 0);
    const home = user.homeColony;
    const leader = user.leader!;
    expect(user.emitSignal(home.id, leader.id, "Bonjour", 1000)).toBeNull();
    home.planet.levels.radar = 1;
    expect(getRadarMessageLength(1)).toBe(100);
    expect(user.emitSignal(home.id, leader.id, "x".repeat(101), 1000)).toBeNull();
    expect(user.emitSignal(home.id, "unknown", "Bonjour", 1000)).toBeNull();
    expect(user.emitSignal(home.id, leader.id, "   ", 1000)).toBeNull();

    const sent = user.emitSignal(home.id, leader.id, "  Bonjour l'univers  ", 1000)!;
    expect(sent).toMatchObject({
      planetName: home.planet.name,
      planetSeed: home.planet.seed,
      authorName: leader.name,
      authorSeed: leader.seed,
      message: "Bonjour l'univers",
      sentAt: 1000,
    });
    expect(decodeSignal(sent.code).ok).toBe(true);
    expect(user.sentSignals).toHaveLength(1);
    expect(user.stats.signalsSent).toBe(1);
  });

  it("receives other players' signals once, and recognizes its own", () => {
    const sender = new User("Autre", 0);
    sender.homeColony.planet.levels.radar = 2;
    const code = sender.emitSignal(sender.homeColonyId, sender.leader!.id, "Ohé !", 5000)!.code;

    const user = new User("Joueur", 0);
    expect(user.receiveSignal(code, 6000)).toEqual({ status: "noRadar" });
    user.homeColony.planet.levels.radar = 1;
    expect(user.receiveSignal("n'importe quoi", 6000)).toEqual({ status: "error", error: "format" });
    expect(user.receiveSignal(code, 6000)).toMatchObject({ status: "received", signal: { message: "Ohé !" } });
    expect(user.receiveSignal(code, 7000).status).toBe("duplicate");
    expect(user.receivedSignals).toHaveLength(1);
    expect(user.receivedSignals[0].receivedAt).toBe(6000);
    expect(user.stats.signalsReceived).toBe(1);
    expect(sender.receiveSignal(code, 6000).status).toBe("own");

    // Through a save and a clone.
    const restored = new User();
    restored.loadFromSnapshot(JSON.parse(JSON.stringify(user)));
    expect(restored.receivedSignals).toEqual(user.receivedSignals);
    const senderRestored = new User();
    senderRestored.loadFromSnapshot(JSON.parse(JSON.stringify(sender)));
    expect(senderRestored.sentSignals).toEqual(sender.sentSignals);
    const copy = restored.clone();
    expect(copy.deleteReceivedSignal(copy.receivedSignals[0].id)).toBe(true);
    expect(restored.receivedSignals).toHaveLength(1);
  });
});
