import React, { useState } from "react";
import { Search } from "lucide-react";
import { getUser } from "../api/users";

const UserSearch: React.FC = () => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    setError("");
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setError("Veuillez entrer un pseudo.");
      return;
    }

    setIsLoading(true);
    try {
      const user = await getUser(trimmedUsername);
      if (user) {
        window.location.href = `/users/${user.username}`;
      } else {
        setError("Aucun utilisateur trouvé.");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Une erreur est survenue lors de la recherche.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <fieldset className="w-full md:w-1/2 border border-primary/20 rounded-2xl p-4 bg-secondary/10 backdrop-blur-sm">
      <legend className="text-primary font-semibold px-2">
        Rechercher un utilisateur
      </legend>
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-accent w-5 h-5" />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            className="input w-full bg-secondary/30 border border-primary/20 text-primary pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent transition h-[48px]"
            placeholder="Entrer un pseudo..."
            disabled={isLoading}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-2 rounded-full font-semibold text-base transition-all duration-200 ease-in-out min-h-[48px] bg-[#ffffa8] hover:bg-[#ffff70] text-gray-900 shadow-[0_4px_15px_rgba(255,255,168,0.3)] hover:shadow-[0_6px_20px_rgba(255,255,168,0.4)] hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Rechercher
            </>
          )}
        </button>
      </div>
      {error && (
        <p className="text-[#D72638] text-sm mt-2 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </fieldset>
  );
};

export default UserSearch;
