/**
 * Class representing a customisable Bubble Chart
 */
class BubbleChart { // eslint-disable-line no-unused-vars
    /**
     * Create a bubble chart in a svg element. The aspect ratio of the bubble chart will always be 1:1.
     * @param {string} selector CSS selector for the svg element to use.
     * @param {Array} data List of data to initialise the bubble chart with.
     * @param {Object} options Object to set default 'width', 'height', 'albumArtEnabled', 'mouseoverOpacity', 'power', 'descriptor'.
     */
    constructor (selector, data = [], options = {}) {
        // Initialise the width and height of the svg element
        const defaults = { width: 600, height: 600, albumArtEnabled: true, mouseoverOpacity: 0.3, power: 1, descriptor: { name: 'Album', value: 'Playcount' } };
        options = { ...defaults, ...options };
        this._width = options.width;
        this._height = options.height;
        // defaults are used unless specified in options
        this._albumArtEnabled = options.albumArtEnabled;
        this._mouseoverOpacity = options.mouseoverOpacity;
        this._power = options.power;
        this._data = data;
        this._descriptor = options.descriptor;
        this._colourFunction = () => '#212121';

        // Initialise the svg element
        this._svg = d3.select(selector)
            .attr('preserveAspectRatio', 'xMinYMin meet')
            .attr('viewBox', `0 0 ${this._width} ${this._height}`)
            .attr('font-size', 12)
            .attr('font-family', 'sans-serif')
            .attr('text-anchor', 'middle');

        this.render();
    }

    /**
     * Album art enabled state. If set to false, images will not be displayed.
     * @type {boolean}
     */
    get albumArtEnabled () {
        return this._albumArtEnabled;
    }

    set albumArtEnabled (albumArtEnabled) {
        this._albumArtEnabled = albumArtEnabled;
        if (albumArtEnabled) {
            d3.selectAll('image')
                .style('display', 'inline');
        } else {
            d3.selectAll('image')
                .style('display', 'none');
        }
    }

    /**
     * Default is 1. Each value in the data is raised to the power specified.
     * @type {number}
     */
    get power () {
        return this._power;
    }

    set power (power) {
        this._power = power;
        this.render();
    }

    /**
     * Function called on click with data passed as a parameter
     * @type {function}
     */
    get clickHandler () {
        return this._clickHandler;
    }

    set clickHandler (clickHandler) {
        this._clickHandler = clickHandler;
    }

    /**
     * Descriptors that are displayed on mouse hover
     * @type {Object}
     * @property {string} name for example "Album"
     * @property {string} value for example "Playcount"
     */
    set descriptor (descriptor) {
        this._descriptor = descriptor;
    }

    get descriptor () {
        return this._descriptor;
    }

    /**
     * List of data points with "value", "name", "image" url and unique "id", displayed on the chart. Will re-render the chart when updated.
     * @type {Array}
     */
    set data (data) {
        this._data = data;
        this.render();
    }

    get data () {
        return this._data;
    }

    /**
     * Opacity of other elements when mouse is over a particular element.
     * @type {number}
     */
    set mouseoverOpacity (mouseoverOpacity) {
        this._mouseoverOpacity = mouseoverOpacity;
    }

    get mouseoverOpacity () {
        return this._mouseoverOpacity;
    }

    /**
     * Function that is called to get a random colour for each chart element.
     * @type {function}
     */
    set colourFunction (colourFunction) {
        this._colourFunction = colourFunction;
    }

    get colourFunction () {
        return this._colourFunction;
    }

    /**
     * Method used to re-render the chart if required. This is called automatically by relevant getters and setters.
     */
    render () {
        if (this._data.length === 0) {
            return;
        }
        const _this = this;

        // Empty the svg element
        this._svg.selectAll('*').remove();

        // Create the packing for the data set & adjust by power if required
        const pack = data => d3.pack()
            .size([this._width - 2, this._height - 2])
            .padding(3)(d3.hierarchy({
                children: data
            }).sum(d => d.value ** (_this._power)));

        // Filter out elements without an image depending on whether album art is enabled
        const root = pack(this._data.filter((element) =>
            !this._albumArtEnabled || !!element.image
        ));

        // Create new g elements for each "leaf" of the packing
        const leaf = this._svg.selectAll('g')
            .data(root.leaves())
            .enter()
            .append('g')
            // Set the positions of each circle
            .attr('transform', d => `translate(${d.x},${d.y})`)
            .on('mouseover', function (d) {
                // On mouseover, remove the clip path of the image so it's displayed fully
                d3.select(this).select('image').attr('clip-path', d => 'null');
                if (!_this._albumArtEnabled) {
                    // Only remove text clip path if album art is disabled
                    d3.select(this).select('text').attr('clip-path', d => 'null');
                }
                // Every other g element has its opacity changed
                d3.selectAll('g').attr('opacity', _this._mouseoverOpacity);
                // Move this element to the front so the artwork appears over other circles
                this.parentNode.appendChild(this);
                // Reset opacity for this element (hovered) to 1.
                d3.select(this).attr('opacity', 1);
            })
            .on('mouseout', function (d) {
                // Reset clip paths for this element
                d3.select(this).select('image').attr('clip-path', d => `url(${d.clipUid.href}`);
                if (!_this._albumArtEnabled) {
                    d3.select(this).select('text').attr('clip-path', d => `url(${d.clipUid.href}`);
                }
                // Reset opacity for all elements
                d3.selectAll('g').attr('opacity', 1);
            })
            .on('click', function (d) {
                // call the click handler if it's defined
                _this._clickHandler && _this._clickHandler(d.data);
            });

        // Every element has a circle with radius that is determined by the packing
        leaf.append('circle')
            // We need to generate an id and url for this leaf - use the data id.
            .attr('id', d => ((d.leafUid = {
                id: 'leaf' + d.data.id,
                href: new URL(`#${'leaf' + d.data.id}`, location) + ''
            }).id))
            .attr('r', d => d.r)
            // Fill the circle using the colour function
            .attr('fill', d => _this._colourFunction());

        // This clip path is used to clip the image and text and is based on the circle shape
        leaf.append('clipPath')
            // Generate a url for the clip path
            .attr('id', d => ((d.clipUid = {
                id: 'clip' + d.data.id,
                href: new URL(`#${'clip' + d.data.id}`, location) + ''
            }).id))
            .append('use')
            // clip path uses the url of the leaf
            .attr('xlink:href', d => d.leafUid.href);

        // Append the text, obtained from the data to the circle and position in center
        leaf.append('text')
            // Use the circle's clip path
            .attr('clip-path', d => `url(${d.clipUid.href}`)
            .selectAll('tspan')
            // Split the name by spaces to help longer names fit
            .data(d => d.data.name.split(' '))
            .enter()
            .append('tspan')
            // Calculate y position based on number of lines
            .attr('x', 0)
            .attr('y', (d, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
            .text(d => d);

        // Fill the circle with the album art
        leaf.append('image')
            .attr('clip-path', d => `url(${d.clipUid.href}`)
            // href comes from the data object
            .attr('href', d => d.data.image)
            // x and y refer to center of circle and top left of image
            .attr('x', d => -d.r)
            .attr('y', d => -d.r)
            // same size as circle
            .attr('height', d => d.r * 2)
            .attr('width', d => d.r * 2)
            // Display only if album art is enabled
            .style('display', (this._albumArtEnabled ? 'inline' : 'none'));

        // Title for when hovering over the circle. Use the descriptor and data.
        leaf.append('title')
            .text(d => `${this._descriptor.name}: ${d.data.name}\n${this._descriptor.value}: ${d.data.value}`);
    }

    /**
     * Shuffle the order of data items in the chart and re-render chart
     */
    shuffle () {
        // with the fisher yates shuffle https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
        for (let i = this._data.length - 1; i > 0; i--) {
            // between 0 and i
            const j = Math.floor(Math.random() * (i + 1));
            // swap
            [this._data[i], this._data[j]] = [this._data[j], this._data[i]];
        }
        this.render();
    }
}
