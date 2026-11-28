import { OFFLINER_VERSION } from "../../utils/constants";
import LegalNoticeLink from "../legal/LegalNotice";

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer({ onOpenSupport }: { onOpenSupport: () => void }) {
  return (
    <footer className="text-center px-4 pt-5 pb-8">
      <p className="m-0 text-(--gray-600) text-[0.8rem] font-medium">
        Offliner v{OFFLINER_VERSION} &copy; {CURRENT_YEAR} Sylvain Alexandre ·{" "}
        <LegalNoticeLink /> ·{" "}
        <button
          type="button"
          className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-inherit underline underline-offset-2 hover:text-(--gray-900)"
          onClick={onOpenSupport}
        >
          Contact et soutien
        </button>
      </p>
    </footer>
  );
}
