export type FilterOption = {
   id: string;
   name: string;
};

export const GENRES: FilterOption[] = [
   { id: '', name: 'All Genres' },
   { id: '1', name: 'Action' },
   { id: '2', name: 'Adventure' },
   { id: '4', name: 'Comedy' },
   { id: '8', name: 'Drama' },
   { id: '10', name: 'Fantasy' },
   { id: '14', name: 'Horror' },
   { id: '22', name: 'Romance' },
   { id: '24', name: 'Sci-Fi' },
   { id: '36', name: 'Slice of Life' },
   { id: '30', name: 'Sports' },
   { id: '37', name: 'Supernatural' },
   { id: '41', name: 'Suspense' },
];

export const STATUSES: FilterOption[] = [
   { id: '', name: 'Any Status' },
   { id: 'airing', name: 'Currently Airing' },
   { id: 'complete', name: 'Finished Airing' },
   { id: 'upcoming', name: 'Upcoming' },
];

export const TYPES: FilterOption[] = [
   { id: '', name: 'Any Format' },
   { id: 'tv', name: 'TV Series' },
   { id: 'movie', name: 'Movie' },
   { id: 'ova', name: 'OVA / Special' },
];

export const SORTS: FilterOption[] = [
   { id: 'popularity-asc', name: 'Most Popular' },
   { id: 'score-desc', name: 'Highest Rated' },
   { id: 'favorites-desc', name: 'Most Favorited' },
   { id: 'start_date-desc', name: 'Newest First' },
];

export const WEEKDAYS = [
   'monday',
   'tuesday',
   'wednesday',
   'thursday',
   'friday',
   'saturday',
   'sunday',
];

export const FAVORITES_KEY = 'zen-stream-favorites';
