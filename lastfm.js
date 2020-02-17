/**
 * Class representing the contained Last.fm API calls. Stores the API key.
 */
class LastFmClient { // eslint-disable-line no-unused-vars
    /**
     * Create an instance of the LastFmClient with provided API key.
     * @param {string} apikey Last.fm API key that will be used to make API calls. Can be obtained here: https://www.last.fm/api/account/create
     */
    constructor (apikey) {
        this._apikey = apikey;
    }

    /**
     * Get list of top albums with playcount, name, id and image. Asynchronous function resolves with result.
     * Error alert is displayed if an error has occurred.
     * @param {string} username username of user.
     * @param {integer} limit Maximum number of albums to fetch.
     * @param {string} period Timescale to fetch top albums.
     * @returns {Array} List of top albums for this user
     */
    async fetchAlbumList (username, limit, period) {
        const albums = [];
        try {
            const response = await fetch(
                `https://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=${username}&period=${period}&limit=${limit}&api_key=${this._apikey}&format=json`
            )
                .then(response => {
                    if (!response.ok) throw new Error(response.status);
                    return response.json();
                });
            response.topalbums.album.forEach(element => {
                const {
                    playcount,
                    name,
                    mbid
                } = element;
                const image = element.image.find(image => image.size === 'extralarge')['#text'];
                albums.push({
                    type: 'release',
                    value: playcount,
                    name,
                    image,
                    id: mbid || ('!' + Math.random().toString(36).substr(2, 12))
                });
            });
        } catch (error) {
            alert('Failed to fetch: ' + error);
        }
        return albums;
    }

    /**
     * Get list of top artists with playcount, name, id. Asynchronous function resolves with result.
     * Error alert is displayed if an error has occurred.
     * @param {string} username username of user.
     * @param {integer} limit Maximum number of artists to fetch.
     * @param {string} period Timescale to fetch top artists.
     * @returns {Array} List of top artists for this user
     */
    async fetchArtistList (username, limit, period) {
        const artists = [];
        try {
            const response = await fetch(
                `https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${username}&period=${period}&limit=${limit}&api_key=${this._apikey}&format=json`
            )
                .then(response => {
                    if (!response.ok) throw new Error(response.status);
                    return response.json();
                });
            response.topartists.artist.forEach(element => {
                const {
                    playcount,
                    name,
                    mbid
                } = element;
                // let image = element.image.find(image => image.size == "extralarge")['#text']; Disabled by Last.fm API
                const image = '';
                artists.push({
                    type: 'artist',
                    value: playcount,
                    name,
                    image,
                    id: mbid || ('!' + Math.random().toString(36).substr(2, 12))
                });
            });
        } catch (error) {
            alert('Failed to fetch: ' + error);
        }
        return artists;
    }

    /**
     * Create a click handler that can be used with this dataset.
     * @returns {function} Click handler
     */
    createClickHandler () {
        return function (data) {
            if (data.id && !data.id.startsWith('!')) {
                window.open(
                    `https://musicbrainz.org/${data.type}/${data.id}`, '_blank');
            } else {
                alert(`No associated MusicBrainz ID for ${data.name}.`);
            }
        };
    }
}
