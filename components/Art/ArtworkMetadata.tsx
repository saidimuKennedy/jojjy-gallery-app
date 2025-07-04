interface ArtworkMetaProps {
  label: string;
  value: string | number;
}

const ArtworkMeta = ({ label, value }: ArtworkMetaProps) => (
  <div>
    <p className="text-gray-500 text-sm">{label}</p>
    <p className="text-gray-900">{value}</p>
  </div>
);

interface ArtworkMetadataProps {
  medium: string;
  dimensions: string;
  year: number;
  category: string;
}

const ArtworkMetadata = ({
  medium,
  dimensions,
  year,
  category,
}: ArtworkMetadataProps) => {
  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <ArtworkMeta label="Medium" value={medium} />
      <ArtworkMeta label="Dimensions" value={dimensions} />
      <ArtworkMeta label="Year" value={year} />
      <ArtworkMeta label="Category" value={category} />
    </div>
  );
};

export default ArtworkMetadata;
