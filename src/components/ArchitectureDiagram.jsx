import { useLanguage } from "../i18n/index.js";

const ArchNode = ({ node, tier, wide }) => {
    const { t } = useLanguage();
    const term = (text) => t.arch.terms[text] ?? text;

    return (
        <div className={`arch-node ${wide ? "self-stretch justify-center" : ""}`}>
            <img src={node.icon} alt="" className="size-7" />
            <div>
                <p className="mono arch-tier">{tier}</p>
                <p className="font-medium">{term(node.name)}</p>
                <p className="text-muted text-xs">{term(node.detail)}</p>
            </div>
        </div>
    );
};

const ArchLink = () => <div className="arch-link" />;

const ArchitectureDiagram = ({ architecture }) => {
    const { clients, server, database } = architecture;
    const { t } = useLanguage();

    return (
        <div className="arch-panel">
            {/* The server node stretches to the clients row so every client link lands on it. */}
            <div className="flex flex-col items-center">
                <div className="arch-clients">
                    {clients.map((client) => (
                        <div key={client.name} className="flex flex-col items-center">
                            <ArchNode node={client} tier={t.arch.client} />
                            <ArchLink />
                        </div>
                    ))}
                </div>
                <ArchNode node={server} tier={t.arch.server} wide={clients.length > 1} />
            </div>
            <ArchLink />
            <ArchNode node={database} tier={t.arch.data} />
        </div>
    );
};

export default ArchitectureDiagram;
