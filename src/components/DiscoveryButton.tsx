type DiscoveryButtonProps = {
  readonly discovered: boolean
  readonly onClick: () => void
}

export default function DiscoveryButton({
  discovered,
  onClick,
}: DiscoveryButtonProps) {
  return (
    <button
      className={
        discovered
          ? "discovery-button revealed"
          : "discovery-button hidden"
      }
      onClick={onClick}
    >
      {discovered
        ? "Revealed"
        : "Hidden"}
    </button>
  )
}