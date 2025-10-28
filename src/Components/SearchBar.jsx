import React from 'react';


export default function SearchBar({ search, setSearch, onSearch }) {
  return (
    <div className="search">
      <input
        className="search-input"
        placeholder="Search JSONPath e.g. $.user.address.city or items[0].name"
        value={search}
        onChange={e => setSearch(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSearch() }}
      />
      <button className="btn" onClick={onSearch}>Search</button>
    </div>
  );
}