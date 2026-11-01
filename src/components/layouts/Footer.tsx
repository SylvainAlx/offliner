import { OFFLINER_VERSION } from "../../utils/constants";

export default function Footer() {
  return (
    <footer className="text-center px-4 pt-5 pb-8">
      <p className="m-0 text-(--gray-600) text-[0.8rem] font-medium">
        Offliner v{OFFLINER_VERSION} &copy; {new Date().getFullYear()}{" "}
      </p>
    </footer>
  );
}
