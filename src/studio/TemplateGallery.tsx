import { useEffect, useState } from 'react';
import { Star, Search } from 'lucide-react';
import { templates, type Template } from '../templates';
import { getSetting, putSetting } from '../storage';
export function TemplateGallery({
  onChoose,
  compact = false,
  limit,
}: {
  onChoose: (t: Template) => void;
  compact?: boolean;
  limit?: number;
}) {
  const [query, setQuery] = useState(''),
    [category, setCategory] = useState('All'),
    [platform, setPlatform] = useState('All'),
    [filter, setFilter] = useState('all'),
    [favorites, setFavorites] = useState<string[]>([]),
    [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    void getSetting<string[]>('favoriteTemplates', []).then(setFavorites);
    void getSetting<string[]>('recentTemplates', []).then(setRecent);
  }, []);

  const choose = (t: Template) => {
    const ids = [t.id, ...recent.filter((id) => id !== t.id)].slice(0, 20);
    setRecent(ids);
    void putSetting('recentTemplates', ids);
    onChoose(t);
  };
  const list = templates
    .filter(
      (t) =>
        (category === 'All' || t.category === category) &&
        (platform === 'All' || t.platform === platform) &&
        (filter === 'all' || (filter === 'favorites' ? favorites : recent).includes(t.id)) &&
        `${t.name} ${t.title} ${t.category} ${t.tags?.join(' ') || ''}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => (filter === 'recent' ? recent.indexOf(a.id) - recent.indexOf(b.id) : 0));
  return (
    <section className={`template-gallery-v2 ${compact ? 'compact-gallery' : ''}`}>
      <div className="section-heading">
        <div>
          <h2>{compact ? 'Design families' : 'Made for what you teach.'}</h2>
          <p>{templates.length} editable templates · original and Data Science collections</p>
        </div>
      </div>
      <label className="search-box">
        <Search size={16} />
        <input
          aria-label="Search templates"
          placeholder="Python, research, formula…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="gallery-filters">
        <select
          aria-label="Template category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="All">All categories</option>
          {[...new Set(templates.map((t) => t.category))].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          aria-label="Template platform"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
        >
          <option value="All">All platforms</option>
          {['Instagram', 'LinkedIn', 'X', 'Facebook', 'WhatsApp'].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <select
          aria-label="Template collection"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All templates</option>
          <option value="favorites">Favorites</option>
          <option value="recent">Recently used</option>
        </select>
      </div>
      <div className={compact ? 'editor-template-grid' : 'template-grid'}>
        {list.slice(0, limit).map((t) => (
          <div className="gallery-card" key={t.id}>
            <button className="template-card" onClick={() => choose(t)}>
              <GalleryThumbnail template={t} />
              <strong>{t.name}</strong>
              <small>
                {t.platform || 'Flexible format'} · {t.format || '1080 × 1080'}
              </small>
              <span className="template-description">
                {t.description || `${t.category} content with editable text, shapes, and colors.`}
              </span>
            </button>
            <button
              className={`favorite-button ${favorites.includes(t.id) ? 'active' : ''}`}
              aria-label={`${favorites.includes(t.id) ? 'Unfavorite' : 'Favorite'} ${t.name}`}
              onClick={() => {
                const next = favorites.includes(t.id)
                  ? favorites.filter((id) => id !== t.id)
                  : [...favorites, t.id];
                setFavorites(next);
                void putSetting('favoriteTemplates', next);
              }}
            >
              <Star size={15} fill={favorites.includes(t.id) ? 'currentColor' : 'none'} />
            </button>
          </div>
        ))}
      </div>
      {!list.length && <p className="empty-state">No templates match these filters.</p>}
    </section>
  );
}
// Generated from the shared renderer; no Konva or code/math rasterization on scroll.
const previews = import.meta.glob<string>('../assets/template-previews/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});
function GalleryThumbnail({ template: t }: { template: Template }) {
  const height = t.platform === 'WhatsApp' ? 1920 : t.layout >= 5 ? 1350 : 1080;
  return (
    <div
      className="template-preview gallery-thumbnail"
      style={{ aspectRatio: '1080/' + height, background: t.palette[0] }}
    >
      <img
        src={previews['../assets/template-previews/' + t.id + '.png']}
        alt=""
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
