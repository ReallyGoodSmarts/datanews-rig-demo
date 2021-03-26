
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    // unfortunately this can't be a constant as that wouldn't be tree-shakeable
    // so we cache the result instead
    let crossorigin;
    function is_crossorigin() {
        if (crossorigin === undefined) {
            crossorigin = false;
            try {
                if (typeof window !== 'undefined' && window.parent) {
                    void window.parent.document;
                }
            }
            catch (error) {
                crossorigin = true;
            }
        }
        return crossorigin;
    }
    function add_resize_listener(node, fn) {
        const computed_style = getComputedStyle(node);
        if (computed_style.position === 'static') {
            node.style.position = 'relative';
        }
        const iframe = element('iframe');
        iframe.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; ' +
            'overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: -1;');
        iframe.setAttribute('aria-hidden', 'true');
        iframe.tabIndex = -1;
        const crossorigin = is_crossorigin();
        let unsubscribe;
        if (crossorigin) {
            iframe.src = "data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}</script>";
            unsubscribe = listen(window, 'message', (event) => {
                if (event.source === iframe.contentWindow)
                    fn();
            });
        }
        else {
            iframe.src = 'about:blank';
            iframe.onload = () => {
                unsubscribe = listen(iframe.contentWindow, 'resize', fn);
            };
        }
        append(node, iframe);
        return () => {
            if (crossorigin) {
                unsubscribe();
            }
            else if (unsubscribe && iframe.contentWindow) {
                unsubscribe();
            }
            detach(iframe);
        };
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.32.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    /* --------------------------------------------
     *
     * Return a truthy value if is zero
     *
     * --------------------------------------------
     */
    function canBeZero (val) {
    	if (val === 0) {
    		return true;
    	}
    	return val;
    }

    function makeAccessor (acc) {
    	if (!canBeZero(acc)) return null;
    	if (Array.isArray(acc)) {
    		return d => acc.map(k => {
    			return typeof k !== 'function' ? d[k] : k(d);
    		});
    	} else if (typeof acc !== 'function') { // eslint-disable-line no-else-return
    		return d => d[acc];
    	}
    	return acc;
    }

    /* --------------------------------------------
     *
     * Remove undefined fields from an object
     *
     * --------------------------------------------
     */

    // From Object.fromEntries polyfill https://github.com/tc39/proposal-object-from-entries/blob/master/polyfill.js#L1
    function fromEntries(iter) {
    	const obj = {};

    	for (const pair of iter) {
    		if (Object(pair) !== pair) {
    			throw new TypeError("iterable for fromEntries should yield objects");
    		}

    		// Consistency with Map: contract is that entry has "0" and "1" keys, not
    		// that it is an array or iterable.

    		const { "0": key, "1": val } = pair;

    		Object.defineProperty(obj, key, {
    			configurable: true,
    			enumerable: true,
    			writable: true,
    			value: val,
    		});
    	}

    	return obj;
    }

    function filterObject (obj) {
    	return fromEntries(Object.entries(obj).filter(([key, value]) => {
    		return value !== undefined;
    	}));
    }

    /* --------------------------------------------
     *
     * Calculate the extents of desired fields
     * Returns an object like:
     * `{x: [0, 10], y: [-10, 10]}` if `fields` is
     * `[{field:'x', accessor: d => d.x}, {field:'y', accessor: d => d.y}]`
     *
     * --------------------------------------------
     */
    function calcExtents (data, fields) {
    	if (!Array.isArray(data) || data.length === 0) return null;
    	const extents = {};
    	const fl = fields.length;
    	let i;
    	let j;
    	let f;
    	let val;
    	let s;

    	if (fl) {
    		for (i = 0; i < fl; i += 1) {
    			const firstRow = fields[i].accessor(data[0]);
    			if (firstRow === undefined || firstRow === null || Number.isNaN(firstRow) === true) {
    				extents[fields[i].field] = [Infinity, -Infinity];
    			} else {
    				extents[fields[i].field] = Array.isArray(firstRow) ? firstRow : [firstRow, firstRow];
    			}
    		}
    		const dl = data.length;
    		for (i = 0; i < dl; i += 1) {
    			for (j = 0; j < fl; j += 1) {
    				f = fields[j];
    				val = f.accessor(data[i]);
    				s = f.field;
    				if (Array.isArray(val)) {
    					const vl = val.length;
    					for (let k = 0; k < vl; k += 1) {
    						if (val[k] !== undefined && val[k] !== null && Number.isNaN(val[k]) === false) {
    							if (val[k] < extents[s][0]) {
    								extents[s][0] = val[k];
    							}
    							if (val[k] > extents[s][1]) {
    								extents[s][1] = val[k];
    							}
    						}
    					}
    				} else if (val !== undefined && val !== null && Number.isNaN(val) === false) {
    					if (val < extents[s][0]) {
    						extents[s][0] = val;
    					}
    					if (val > extents[s][1]) {
    						extents[s][1] = val;
    					}
    				}
    			}
    		}
    	} else {
    		return null;
    	}
    	return extents;
    }

    /* --------------------------------------------
     * If we have a domain from settings, fill in
     * any null values with ones from our measured extents
     * otherwise, return the measured extent
     */
    function partialDomain (domain = [], directive) {
    	if (Array.isArray(directive) === true) {
    		return directive.map((d, i) => {
    			if (d === null) {
    				return domain[i];
    			}
    			return d;
    		});
    	}
    	return domain;
    }

    function calcDomain (s) {
    	return function domainCalc ([$extents, $domain]) {
    		return $extents ? partialDomain($extents[s], $domain) : $domain;
    	};
    }

    function ascending(a, b) {
      return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
    }

    function bisector(f) {
      let delta = f;
      let compare = f;

      if (f.length === 1) {
        delta = (d, x) => f(d) - x;
        compare = ascendingComparator(f);
      }

      function left(a, x, lo, hi) {
        if (lo == null) lo = 0;
        if (hi == null) hi = a.length;
        while (lo < hi) {
          const mid = (lo + hi) >>> 1;
          if (compare(a[mid], x) < 0) lo = mid + 1;
          else hi = mid;
        }
        return lo;
      }

      function right(a, x, lo, hi) {
        if (lo == null) lo = 0;
        if (hi == null) hi = a.length;
        while (lo < hi) {
          const mid = (lo + hi) >>> 1;
          if (compare(a[mid], x) > 0) hi = mid;
          else lo = mid + 1;
        }
        return lo;
      }

      function center(a, x, lo, hi) {
        if (lo == null) lo = 0;
        if (hi == null) hi = a.length;
        const i = left(a, x, lo, hi - 1);
        return i > lo && delta(a[i - 1], x) > -delta(a[i], x) ? i - 1 : i;
      }

      return {left, center, right};
    }

    function ascendingComparator(f) {
      return (d, x) => ascending(f(d), x);
    }

    function number(x) {
      return x === null ? NaN : +x;
    }

    const ascendingBisect = bisector(ascending);
    const bisectRight = ascendingBisect.right;
    bisector(number).center;

    // https://github.com/python/cpython/blob/a74eea238f5baba15797e2e8b570d153bc8690a7/Modules/mathmodule.c#L1423
    class Adder {
      constructor() {
        this._partials = new Float64Array(32);
        this._n = 0;
      }
      add(x) {
        const p = this._partials;
        let i = 0;
        for (let j = 0; j < this._n && j < 32; j++) {
          const y = p[j],
            hi = x + y,
            lo = Math.abs(x) < Math.abs(y) ? x - (hi - y) : y - (hi - x);
          if (lo) p[i++] = lo;
          x = hi;
        }
        p[i] = x;
        this._n = i + 1;
        return this;
      }
      valueOf() {
        const p = this._partials;
        let n = this._n, x, y, lo, hi = 0;
        if (n > 0) {
          hi = p[--n];
          while (n > 0) {
            x = hi;
            y = p[--n];
            hi = x + y;
            lo = y - (hi - x);
            if (lo) break;
          }
          if (n > 0 && ((lo < 0 && p[n - 1] < 0) || (lo > 0 && p[n - 1] > 0))) {
            y = lo * 2;
            x = hi + y;
            if (y == x - hi) hi = x;
          }
        }
        return hi;
      }
    }

    var e10 = Math.sqrt(50),
        e5 = Math.sqrt(10),
        e2 = Math.sqrt(2);

    function ticks(start, stop, count) {
      var reverse,
          i = -1,
          n,
          ticks,
          step;

      stop = +stop, start = +start, count = +count;
      if (start === stop && count > 0) return [start];
      if (reverse = stop < start) n = start, start = stop, stop = n;
      if ((step = tickIncrement(start, stop, count)) === 0 || !isFinite(step)) return [];

      if (step > 0) {
        start = Math.ceil(start / step);
        stop = Math.floor(stop / step);
        ticks = new Array(n = Math.ceil(stop - start + 1));
        while (++i < n) ticks[i] = (start + i) * step;
      } else {
        step = -step;
        start = Math.ceil(start * step);
        stop = Math.floor(stop * step);
        ticks = new Array(n = Math.ceil(stop - start + 1));
        while (++i < n) ticks[i] = (start + i) / step;
      }

      if (reverse) ticks.reverse();

      return ticks;
    }

    function tickIncrement(start, stop, count) {
      var step = (stop - start) / Math.max(0, count),
          power = Math.floor(Math.log(step) / Math.LN10),
          error = step / Math.pow(10, power);
      return power >= 0
          ? (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1) * Math.pow(10, power)
          : -Math.pow(10, -power) / (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1);
    }

    function tickStep(start, stop, count) {
      var step0 = Math.abs(stop - start) / Math.max(0, count),
          step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
          error = step0 / step1;
      if (error >= e10) step1 *= 10;
      else if (error >= e5) step1 *= 5;
      else if (error >= e2) step1 *= 2;
      return stop < start ? -step1 : step1;
    }

    function* flatten(arrays) {
      for (const array of arrays) {
        yield* array;
      }
    }

    function merge(arrays) {
      return Array.from(flatten(arrays));
    }

    function initRange(domain, range) {
      switch (arguments.length) {
        case 0: break;
        case 1: this.range(domain); break;
        default: this.range(range).domain(domain); break;
      }
      return this;
    }

    function define(constructor, factory, prototype) {
      constructor.prototype = factory.prototype = prototype;
      prototype.constructor = constructor;
    }

    function extend(parent, definition) {
      var prototype = Object.create(parent.prototype);
      for (var key in definition) prototype[key] = definition[key];
      return prototype;
    }

    function Color() {}

    var darker = 0.7;
    var brighter = 1 / darker;

    var reI = "\\s*([+-]?\\d+)\\s*",
        reN = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*",
        reP = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
        reHex = /^#([0-9a-f]{3,8})$/,
        reRgbInteger = new RegExp("^rgb\\(" + [reI, reI, reI] + "\\)$"),
        reRgbPercent = new RegExp("^rgb\\(" + [reP, reP, reP] + "\\)$"),
        reRgbaInteger = new RegExp("^rgba\\(" + [reI, reI, reI, reN] + "\\)$"),
        reRgbaPercent = new RegExp("^rgba\\(" + [reP, reP, reP, reN] + "\\)$"),
        reHslPercent = new RegExp("^hsl\\(" + [reN, reP, reP] + "\\)$"),
        reHslaPercent = new RegExp("^hsla\\(" + [reN, reP, reP, reN] + "\\)$");

    var named = {
      aliceblue: 0xf0f8ff,
      antiquewhite: 0xfaebd7,
      aqua: 0x00ffff,
      aquamarine: 0x7fffd4,
      azure: 0xf0ffff,
      beige: 0xf5f5dc,
      bisque: 0xffe4c4,
      black: 0x000000,
      blanchedalmond: 0xffebcd,
      blue: 0x0000ff,
      blueviolet: 0x8a2be2,
      brown: 0xa52a2a,
      burlywood: 0xdeb887,
      cadetblue: 0x5f9ea0,
      chartreuse: 0x7fff00,
      chocolate: 0xd2691e,
      coral: 0xff7f50,
      cornflowerblue: 0x6495ed,
      cornsilk: 0xfff8dc,
      crimson: 0xdc143c,
      cyan: 0x00ffff,
      darkblue: 0x00008b,
      darkcyan: 0x008b8b,
      darkgoldenrod: 0xb8860b,
      darkgray: 0xa9a9a9,
      darkgreen: 0x006400,
      darkgrey: 0xa9a9a9,
      darkkhaki: 0xbdb76b,
      darkmagenta: 0x8b008b,
      darkolivegreen: 0x556b2f,
      darkorange: 0xff8c00,
      darkorchid: 0x9932cc,
      darkred: 0x8b0000,
      darksalmon: 0xe9967a,
      darkseagreen: 0x8fbc8f,
      darkslateblue: 0x483d8b,
      darkslategray: 0x2f4f4f,
      darkslategrey: 0x2f4f4f,
      darkturquoise: 0x00ced1,
      darkviolet: 0x9400d3,
      deeppink: 0xff1493,
      deepskyblue: 0x00bfff,
      dimgray: 0x696969,
      dimgrey: 0x696969,
      dodgerblue: 0x1e90ff,
      firebrick: 0xb22222,
      floralwhite: 0xfffaf0,
      forestgreen: 0x228b22,
      fuchsia: 0xff00ff,
      gainsboro: 0xdcdcdc,
      ghostwhite: 0xf8f8ff,
      gold: 0xffd700,
      goldenrod: 0xdaa520,
      gray: 0x808080,
      green: 0x008000,
      greenyellow: 0xadff2f,
      grey: 0x808080,
      honeydew: 0xf0fff0,
      hotpink: 0xff69b4,
      indianred: 0xcd5c5c,
      indigo: 0x4b0082,
      ivory: 0xfffff0,
      khaki: 0xf0e68c,
      lavender: 0xe6e6fa,
      lavenderblush: 0xfff0f5,
      lawngreen: 0x7cfc00,
      lemonchiffon: 0xfffacd,
      lightblue: 0xadd8e6,
      lightcoral: 0xf08080,
      lightcyan: 0xe0ffff,
      lightgoldenrodyellow: 0xfafad2,
      lightgray: 0xd3d3d3,
      lightgreen: 0x90ee90,
      lightgrey: 0xd3d3d3,
      lightpink: 0xffb6c1,
      lightsalmon: 0xffa07a,
      lightseagreen: 0x20b2aa,
      lightskyblue: 0x87cefa,
      lightslategray: 0x778899,
      lightslategrey: 0x778899,
      lightsteelblue: 0xb0c4de,
      lightyellow: 0xffffe0,
      lime: 0x00ff00,
      limegreen: 0x32cd32,
      linen: 0xfaf0e6,
      magenta: 0xff00ff,
      maroon: 0x800000,
      mediumaquamarine: 0x66cdaa,
      mediumblue: 0x0000cd,
      mediumorchid: 0xba55d3,
      mediumpurple: 0x9370db,
      mediumseagreen: 0x3cb371,
      mediumslateblue: 0x7b68ee,
      mediumspringgreen: 0x00fa9a,
      mediumturquoise: 0x48d1cc,
      mediumvioletred: 0xc71585,
      midnightblue: 0x191970,
      mintcream: 0xf5fffa,
      mistyrose: 0xffe4e1,
      moccasin: 0xffe4b5,
      navajowhite: 0xffdead,
      navy: 0x000080,
      oldlace: 0xfdf5e6,
      olive: 0x808000,
      olivedrab: 0x6b8e23,
      orange: 0xffa500,
      orangered: 0xff4500,
      orchid: 0xda70d6,
      palegoldenrod: 0xeee8aa,
      palegreen: 0x98fb98,
      paleturquoise: 0xafeeee,
      palevioletred: 0xdb7093,
      papayawhip: 0xffefd5,
      peachpuff: 0xffdab9,
      peru: 0xcd853f,
      pink: 0xffc0cb,
      plum: 0xdda0dd,
      powderblue: 0xb0e0e6,
      purple: 0x800080,
      rebeccapurple: 0x663399,
      red: 0xff0000,
      rosybrown: 0xbc8f8f,
      royalblue: 0x4169e1,
      saddlebrown: 0x8b4513,
      salmon: 0xfa8072,
      sandybrown: 0xf4a460,
      seagreen: 0x2e8b57,
      seashell: 0xfff5ee,
      sienna: 0xa0522d,
      silver: 0xc0c0c0,
      skyblue: 0x87ceeb,
      slateblue: 0x6a5acd,
      slategray: 0x708090,
      slategrey: 0x708090,
      snow: 0xfffafa,
      springgreen: 0x00ff7f,
      steelblue: 0x4682b4,
      tan: 0xd2b48c,
      teal: 0x008080,
      thistle: 0xd8bfd8,
      tomato: 0xff6347,
      turquoise: 0x40e0d0,
      violet: 0xee82ee,
      wheat: 0xf5deb3,
      white: 0xffffff,
      whitesmoke: 0xf5f5f5,
      yellow: 0xffff00,
      yellowgreen: 0x9acd32
    };

    define(Color, color, {
      copy: function(channels) {
        return Object.assign(new this.constructor, this, channels);
      },
      displayable: function() {
        return this.rgb().displayable();
      },
      hex: color_formatHex, // Deprecated! Use color.formatHex.
      formatHex: color_formatHex,
      formatHsl: color_formatHsl,
      formatRgb: color_formatRgb,
      toString: color_formatRgb
    });

    function color_formatHex() {
      return this.rgb().formatHex();
    }

    function color_formatHsl() {
      return hslConvert(this).formatHsl();
    }

    function color_formatRgb() {
      return this.rgb().formatRgb();
    }

    function color(format) {
      var m, l;
      format = (format + "").trim().toLowerCase();
      return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) // #ff0000
          : l === 3 ? new Rgb((m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1) // #f00
          : l === 8 ? rgba(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
          : l === 4 ? rgba((m >> 12 & 0xf) | (m >> 8 & 0xf0), (m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), (((m & 0xf) << 4) | (m & 0xf)) / 0xff) // #f000
          : null) // invalid hex
          : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
          : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
          : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
          : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
          : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
          : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
          : named.hasOwnProperty(format) ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
          : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
          : null;
    }

    function rgbn(n) {
      return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
    }

    function rgba(r, g, b, a) {
      if (a <= 0) r = g = b = NaN;
      return new Rgb(r, g, b, a);
    }

    function rgbConvert(o) {
      if (!(o instanceof Color)) o = color(o);
      if (!o) return new Rgb;
      o = o.rgb();
      return new Rgb(o.r, o.g, o.b, o.opacity);
    }

    function rgb(r, g, b, opacity) {
      return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
    }

    function Rgb(r, g, b, opacity) {
      this.r = +r;
      this.g = +g;
      this.b = +b;
      this.opacity = +opacity;
    }

    define(Rgb, rgb, extend(Color, {
      brighter: function(k) {
        k = k == null ? brighter : Math.pow(brighter, k);
        return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
      },
      darker: function(k) {
        k = k == null ? darker : Math.pow(darker, k);
        return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
      },
      rgb: function() {
        return this;
      },
      displayable: function() {
        return (-0.5 <= this.r && this.r < 255.5)
            && (-0.5 <= this.g && this.g < 255.5)
            && (-0.5 <= this.b && this.b < 255.5)
            && (0 <= this.opacity && this.opacity <= 1);
      },
      hex: rgb_formatHex, // Deprecated! Use color.formatHex.
      formatHex: rgb_formatHex,
      formatRgb: rgb_formatRgb,
      toString: rgb_formatRgb
    }));

    function rgb_formatHex() {
      return "#" + hex(this.r) + hex(this.g) + hex(this.b);
    }

    function rgb_formatRgb() {
      var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
      return (a === 1 ? "rgb(" : "rgba(")
          + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", "
          + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", "
          + Math.max(0, Math.min(255, Math.round(this.b) || 0))
          + (a === 1 ? ")" : ", " + a + ")");
    }

    function hex(value) {
      value = Math.max(0, Math.min(255, Math.round(value) || 0));
      return (value < 16 ? "0" : "") + value.toString(16);
    }

    function hsla(h, s, l, a) {
      if (a <= 0) h = s = l = NaN;
      else if (l <= 0 || l >= 1) h = s = NaN;
      else if (s <= 0) h = NaN;
      return new Hsl(h, s, l, a);
    }

    function hslConvert(o) {
      if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
      if (!(o instanceof Color)) o = color(o);
      if (!o) return new Hsl;
      if (o instanceof Hsl) return o;
      o = o.rgb();
      var r = o.r / 255,
          g = o.g / 255,
          b = o.b / 255,
          min = Math.min(r, g, b),
          max = Math.max(r, g, b),
          h = NaN,
          s = max - min,
          l = (max + min) / 2;
      if (s) {
        if (r === max) h = (g - b) / s + (g < b) * 6;
        else if (g === max) h = (b - r) / s + 2;
        else h = (r - g) / s + 4;
        s /= l < 0.5 ? max + min : 2 - max - min;
        h *= 60;
      } else {
        s = l > 0 && l < 1 ? 0 : h;
      }
      return new Hsl(h, s, l, o.opacity);
    }

    function hsl(h, s, l, opacity) {
      return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
    }

    function Hsl(h, s, l, opacity) {
      this.h = +h;
      this.s = +s;
      this.l = +l;
      this.opacity = +opacity;
    }

    define(Hsl, hsl, extend(Color, {
      brighter: function(k) {
        k = k == null ? brighter : Math.pow(brighter, k);
        return new Hsl(this.h, this.s, this.l * k, this.opacity);
      },
      darker: function(k) {
        k = k == null ? darker : Math.pow(darker, k);
        return new Hsl(this.h, this.s, this.l * k, this.opacity);
      },
      rgb: function() {
        var h = this.h % 360 + (this.h < 0) * 360,
            s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
            l = this.l,
            m2 = l + (l < 0.5 ? l : 1 - l) * s,
            m1 = 2 * l - m2;
        return new Rgb(
          hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
          hsl2rgb(h, m1, m2),
          hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
          this.opacity
        );
      },
      displayable: function() {
        return (0 <= this.s && this.s <= 1 || isNaN(this.s))
            && (0 <= this.l && this.l <= 1)
            && (0 <= this.opacity && this.opacity <= 1);
      },
      formatHsl: function() {
        var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
        return (a === 1 ? "hsl(" : "hsla(")
            + (this.h || 0) + ", "
            + (this.s || 0) * 100 + "%, "
            + (this.l || 0) * 100 + "%"
            + (a === 1 ? ")" : ", " + a + ")");
      }
    }));

    /* From FvD 13.37, CSS Color Module Level 3 */
    function hsl2rgb(h, m1, m2) {
      return (h < 60 ? m1 + (m2 - m1) * h / 60
          : h < 180 ? m2
          : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
          : m1) * 255;
    }

    var constant = x => () => x;

    function linear(a, d) {
      return function(t) {
        return a + t * d;
      };
    }

    function exponential(a, b, y) {
      return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
        return Math.pow(a + t * b, y);
      };
    }

    function gamma(y) {
      return (y = +y) === 1 ? nogamma : function(a, b) {
        return b - a ? exponential(a, b, y) : constant(isNaN(a) ? b : a);
      };
    }

    function nogamma(a, b) {
      var d = b - a;
      return d ? linear(a, d) : constant(isNaN(a) ? b : a);
    }

    var rgb$1 = (function rgbGamma(y) {
      var color = gamma(y);

      function rgb$1(start, end) {
        var r = color((start = rgb(start)).r, (end = rgb(end)).r),
            g = color(start.g, end.g),
            b = color(start.b, end.b),
            opacity = nogamma(start.opacity, end.opacity);
        return function(t) {
          start.r = r(t);
          start.g = g(t);
          start.b = b(t);
          start.opacity = opacity(t);
          return start + "";
        };
      }

      rgb$1.gamma = rgbGamma;

      return rgb$1;
    })(1);

    function numberArray(a, b) {
      if (!b) b = [];
      var n = a ? Math.min(b.length, a.length) : 0,
          c = b.slice(),
          i;
      return function(t) {
        for (i = 0; i < n; ++i) c[i] = a[i] * (1 - t) + b[i] * t;
        return c;
      };
    }

    function isNumberArray(x) {
      return ArrayBuffer.isView(x) && !(x instanceof DataView);
    }

    function genericArray(a, b) {
      var nb = b ? b.length : 0,
          na = a ? Math.min(nb, a.length) : 0,
          x = new Array(na),
          c = new Array(nb),
          i;

      for (i = 0; i < na; ++i) x[i] = interpolate(a[i], b[i]);
      for (; i < nb; ++i) c[i] = b[i];

      return function(t) {
        for (i = 0; i < na; ++i) c[i] = x[i](t);
        return c;
      };
    }

    function date(a, b) {
      var d = new Date;
      return a = +a, b = +b, function(t) {
        return d.setTime(a * (1 - t) + b * t), d;
      };
    }

    function interpolateNumber(a, b) {
      return a = +a, b = +b, function(t) {
        return a * (1 - t) + b * t;
      };
    }

    function object(a, b) {
      var i = {},
          c = {},
          k;

      if (a === null || typeof a !== "object") a = {};
      if (b === null || typeof b !== "object") b = {};

      for (k in b) {
        if (k in a) {
          i[k] = interpolate(a[k], b[k]);
        } else {
          c[k] = b[k];
        }
      }

      return function(t) {
        for (k in i) c[k] = i[k](t);
        return c;
      };
    }

    var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
        reB = new RegExp(reA.source, "g");

    function zero(b) {
      return function() {
        return b;
      };
    }

    function one(b) {
      return function(t) {
        return b(t) + "";
      };
    }

    function string(a, b) {
      var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
          am, // current match in a
          bm, // current match in b
          bs, // string preceding current number in b, if any
          i = -1, // index in s
          s = [], // string constants and placeholders
          q = []; // number interpolators

      // Coerce inputs to strings.
      a = a + "", b = b + "";

      // Interpolate pairs of numbers in a & b.
      while ((am = reA.exec(a))
          && (bm = reB.exec(b))) {
        if ((bs = bm.index) > bi) { // a string precedes the next number in b
          bs = b.slice(bi, bs);
          if (s[i]) s[i] += bs; // coalesce with previous string
          else s[++i] = bs;
        }
        if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
          if (s[i]) s[i] += bm; // coalesce with previous string
          else s[++i] = bm;
        } else { // interpolate non-matching numbers
          s[++i] = null;
          q.push({i: i, x: interpolateNumber(am, bm)});
        }
        bi = reB.lastIndex;
      }

      // Add remains of b.
      if (bi < b.length) {
        bs = b.slice(bi);
        if (s[i]) s[i] += bs; // coalesce with previous string
        else s[++i] = bs;
      }

      // Special optimization for only a single match.
      // Otherwise, interpolate each of the numbers and rejoin the string.
      return s.length < 2 ? (q[0]
          ? one(q[0].x)
          : zero(b))
          : (b = q.length, function(t) {
              for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
              return s.join("");
            });
    }

    function interpolate(a, b) {
      var t = typeof b, c;
      return b == null || t === "boolean" ? constant(b)
          : (t === "number" ? interpolateNumber
          : t === "string" ? ((c = color(b)) ? (b = c, rgb$1) : string)
          : b instanceof color ? rgb$1
          : b instanceof Date ? date
          : isNumberArray(b) ? numberArray
          : Array.isArray(b) ? genericArray
          : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object
          : interpolateNumber)(a, b);
    }

    function interpolateRound(a, b) {
      return a = +a, b = +b, function(t) {
        return Math.round(a * (1 - t) + b * t);
      };
    }

    function constants(x) {
      return function() {
        return x;
      };
    }

    function number$1(x) {
      return +x;
    }

    var unit = [0, 1];

    function identity(x) {
      return x;
    }

    function normalize(a, b) {
      return (b -= (a = +a))
          ? function(x) { return (x - a) / b; }
          : constants(isNaN(b) ? NaN : 0.5);
    }

    function clamper(a, b) {
      var t;
      if (a > b) t = a, a = b, b = t;
      return function(x) { return Math.max(a, Math.min(b, x)); };
    }

    // normalize(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
    // interpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding range value x in [a,b].
    function bimap(domain, range, interpolate) {
      var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
      if (d1 < d0) d0 = normalize(d1, d0), r0 = interpolate(r1, r0);
      else d0 = normalize(d0, d1), r0 = interpolate(r0, r1);
      return function(x) { return r0(d0(x)); };
    }

    function polymap(domain, range, interpolate) {
      var j = Math.min(domain.length, range.length) - 1,
          d = new Array(j),
          r = new Array(j),
          i = -1;

      // Reverse descending domains.
      if (domain[j] < domain[0]) {
        domain = domain.slice().reverse();
        range = range.slice().reverse();
      }

      while (++i < j) {
        d[i] = normalize(domain[i], domain[i + 1]);
        r[i] = interpolate(range[i], range[i + 1]);
      }

      return function(x) {
        var i = bisectRight(domain, x, 1, j) - 1;
        return r[i](d[i](x));
      };
    }

    function copy(source, target) {
      return target
          .domain(source.domain())
          .range(source.range())
          .interpolate(source.interpolate())
          .clamp(source.clamp())
          .unknown(source.unknown());
    }

    function transformer() {
      var domain = unit,
          range = unit,
          interpolate$1 = interpolate,
          transform,
          untransform,
          unknown,
          clamp = identity,
          piecewise,
          output,
          input;

      function rescale() {
        var n = Math.min(domain.length, range.length);
        if (clamp !== identity) clamp = clamper(domain[0], domain[n - 1]);
        piecewise = n > 2 ? polymap : bimap;
        output = input = null;
        return scale;
      }

      function scale(x) {
        return isNaN(x = +x) ? unknown : (output || (output = piecewise(domain.map(transform), range, interpolate$1)))(transform(clamp(x)));
      }

      scale.invert = function(y) {
        return clamp(untransform((input || (input = piecewise(range, domain.map(transform), interpolateNumber)))(y)));
      };

      scale.domain = function(_) {
        return arguments.length ? (domain = Array.from(_, number$1), rescale()) : domain.slice();
      };

      scale.range = function(_) {
        return arguments.length ? (range = Array.from(_), rescale()) : range.slice();
      };

      scale.rangeRound = function(_) {
        return range = Array.from(_), interpolate$1 = interpolateRound, rescale();
      };

      scale.clamp = function(_) {
        return arguments.length ? (clamp = _ ? true : identity, rescale()) : clamp !== identity;
      };

      scale.interpolate = function(_) {
        return arguments.length ? (interpolate$1 = _, rescale()) : interpolate$1;
      };

      scale.unknown = function(_) {
        return arguments.length ? (unknown = _, scale) : unknown;
      };

      return function(t, u) {
        transform = t, untransform = u;
        return rescale();
      };
    }

    function continuous() {
      return transformer()(identity, identity);
    }

    function formatDecimal(x) {
      return Math.abs(x = Math.round(x)) >= 1e21
          ? x.toLocaleString("en").replace(/,/g, "")
          : x.toString(10);
    }

    // Computes the decimal coefficient and exponent of the specified number x with
    // significant digits p, where x is positive and p is in [1, 21] or undefined.
    // For example, formatDecimalParts(1.23) returns ["123", 0].
    function formatDecimalParts(x, p) {
      if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
      var i, coefficient = x.slice(0, i);

      // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
      // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
      return [
        coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
        +x.slice(i + 1)
      ];
    }

    function exponent(x) {
      return x = formatDecimalParts(Math.abs(x)), x ? x[1] : NaN;
    }

    function formatGroup(grouping, thousands) {
      return function(value, width) {
        var i = value.length,
            t = [],
            j = 0,
            g = grouping[0],
            length = 0;

        while (i > 0 && g > 0) {
          if (length + g + 1 > width) g = Math.max(1, width - length);
          t.push(value.substring(i -= g, i + g));
          if ((length += g + 1) > width) break;
          g = grouping[j = (j + 1) % grouping.length];
        }

        return t.reverse().join(thousands);
      };
    }

    function formatNumerals(numerals) {
      return function(value) {
        return value.replace(/[0-9]/g, function(i) {
          return numerals[+i];
        });
      };
    }

    // [[fill]align][sign][symbol][0][width][,][.precision][~][type]
    var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;

    function formatSpecifier(specifier) {
      if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);
      var match;
      return new FormatSpecifier({
        fill: match[1],
        align: match[2],
        sign: match[3],
        symbol: match[4],
        zero: match[5],
        width: match[6],
        comma: match[7],
        precision: match[8] && match[8].slice(1),
        trim: match[9],
        type: match[10]
      });
    }

    formatSpecifier.prototype = FormatSpecifier.prototype; // instanceof

    function FormatSpecifier(specifier) {
      this.fill = specifier.fill === undefined ? " " : specifier.fill + "";
      this.align = specifier.align === undefined ? ">" : specifier.align + "";
      this.sign = specifier.sign === undefined ? "-" : specifier.sign + "";
      this.symbol = specifier.symbol === undefined ? "" : specifier.symbol + "";
      this.zero = !!specifier.zero;
      this.width = specifier.width === undefined ? undefined : +specifier.width;
      this.comma = !!specifier.comma;
      this.precision = specifier.precision === undefined ? undefined : +specifier.precision;
      this.trim = !!specifier.trim;
      this.type = specifier.type === undefined ? "" : specifier.type + "";
    }

    FormatSpecifier.prototype.toString = function() {
      return this.fill
          + this.align
          + this.sign
          + this.symbol
          + (this.zero ? "0" : "")
          + (this.width === undefined ? "" : Math.max(1, this.width | 0))
          + (this.comma ? "," : "")
          + (this.precision === undefined ? "" : "." + Math.max(0, this.precision | 0))
          + (this.trim ? "~" : "")
          + this.type;
    };

    // Trims insignificant zeros, e.g., replaces 1.2000k with 1.2k.
    function formatTrim(s) {
      out: for (var n = s.length, i = 1, i0 = -1, i1; i < n; ++i) {
        switch (s[i]) {
          case ".": i0 = i1 = i; break;
          case "0": if (i0 === 0) i0 = i; i1 = i; break;
          default: if (!+s[i]) break out; if (i0 > 0) i0 = 0; break;
        }
      }
      return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s;
    }

    var prefixExponent;

    function formatPrefixAuto(x, p) {
      var d = formatDecimalParts(x, p);
      if (!d) return x + "";
      var coefficient = d[0],
          exponent = d[1],
          i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
          n = coefficient.length;
      return i === n ? coefficient
          : i > n ? coefficient + new Array(i - n + 1).join("0")
          : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
          : "0." + new Array(1 - i).join("0") + formatDecimalParts(x, Math.max(0, p + i - 1))[0]; // less than 1y!
    }

    function formatRounded(x, p) {
      var d = formatDecimalParts(x, p);
      if (!d) return x + "";
      var coefficient = d[0],
          exponent = d[1];
      return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
          : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
          : coefficient + new Array(exponent - coefficient.length + 2).join("0");
    }

    var formatTypes = {
      "%": (x, p) => (x * 100).toFixed(p),
      "b": (x) => Math.round(x).toString(2),
      "c": (x) => x + "",
      "d": formatDecimal,
      "e": (x, p) => x.toExponential(p),
      "f": (x, p) => x.toFixed(p),
      "g": (x, p) => x.toPrecision(p),
      "o": (x) => Math.round(x).toString(8),
      "p": (x, p) => formatRounded(x * 100, p),
      "r": formatRounded,
      "s": formatPrefixAuto,
      "X": (x) => Math.round(x).toString(16).toUpperCase(),
      "x": (x) => Math.round(x).toString(16)
    };

    function identity$1(x) {
      return x;
    }

    var map = Array.prototype.map,
        prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];

    function formatLocale(locale) {
      var group = locale.grouping === undefined || locale.thousands === undefined ? identity$1 : formatGroup(map.call(locale.grouping, Number), locale.thousands + ""),
          currencyPrefix = locale.currency === undefined ? "" : locale.currency[0] + "",
          currencySuffix = locale.currency === undefined ? "" : locale.currency[1] + "",
          decimal = locale.decimal === undefined ? "." : locale.decimal + "",
          numerals = locale.numerals === undefined ? identity$1 : formatNumerals(map.call(locale.numerals, String)),
          percent = locale.percent === undefined ? "%" : locale.percent + "",
          minus = locale.minus === undefined ? "−" : locale.minus + "",
          nan = locale.nan === undefined ? "NaN" : locale.nan + "";

      function newFormat(specifier) {
        specifier = formatSpecifier(specifier);

        var fill = specifier.fill,
            align = specifier.align,
            sign = specifier.sign,
            symbol = specifier.symbol,
            zero = specifier.zero,
            width = specifier.width,
            comma = specifier.comma,
            precision = specifier.precision,
            trim = specifier.trim,
            type = specifier.type;

        // The "n" type is an alias for ",g".
        if (type === "n") comma = true, type = "g";

        // The "" type, and any invalid type, is an alias for ".12~g".
        else if (!formatTypes[type]) precision === undefined && (precision = 12), trim = true, type = "g";

        // If zero fill is specified, padding goes after sign and before digits.
        if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

        // Compute the prefix and suffix.
        // For SI-prefix, the suffix is lazily computed.
        var prefix = symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
            suffix = symbol === "$" ? currencySuffix : /[%p]/.test(type) ? percent : "";

        // What format function should we use?
        // Is this an integer type?
        // Can this type generate exponential notation?
        var formatType = formatTypes[type],
            maybeSuffix = /[defgprs%]/.test(type);

        // Set the default precision if not specified,
        // or clamp the specified precision to the supported range.
        // For significant precision, it must be in [1, 21].
        // For fixed precision, it must be in [0, 20].
        precision = precision === undefined ? 6
            : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
            : Math.max(0, Math.min(20, precision));

        function format(value) {
          var valuePrefix = prefix,
              valueSuffix = suffix,
              i, n, c;

          if (type === "c") {
            valueSuffix = formatType(value) + valueSuffix;
            value = "";
          } else {
            value = +value;

            // Determine the sign. -0 is not less than 0, but 1 / -0 is!
            var valueNegative = value < 0 || 1 / value < 0;

            // Perform the initial formatting.
            value = isNaN(value) ? nan : formatType(Math.abs(value), precision);

            // Trim insignificant zeros.
            if (trim) value = formatTrim(value);

            // If a negative value rounds to zero after formatting, and no explicit positive sign is requested, hide the sign.
            if (valueNegative && +value === 0 && sign !== "+") valueNegative = false;

            // Compute the prefix and suffix.
            valuePrefix = (valueNegative ? (sign === "(" ? sign : minus) : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
            valueSuffix = (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign === "(" ? ")" : "");

            // Break the formatted value into the integer “value” part that can be
            // grouped, and fractional or exponential “suffix” part that is not.
            if (maybeSuffix) {
              i = -1, n = value.length;
              while (++i < n) {
                if (c = value.charCodeAt(i), 48 > c || c > 57) {
                  valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
                  value = value.slice(0, i);
                  break;
                }
              }
            }
          }

          // If the fill character is not "0", grouping is applied before padding.
          if (comma && !zero) value = group(value, Infinity);

          // Compute the padding.
          var length = valuePrefix.length + value.length + valueSuffix.length,
              padding = length < width ? new Array(width - length + 1).join(fill) : "";

          // If the fill character is "0", grouping is applied after padding.
          if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

          // Reconstruct the final output based on the desired alignment.
          switch (align) {
            case "<": value = valuePrefix + value + valueSuffix + padding; break;
            case "=": value = valuePrefix + padding + value + valueSuffix; break;
            case "^": value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length); break;
            default: value = padding + valuePrefix + value + valueSuffix; break;
          }

          return numerals(value);
        }

        format.toString = function() {
          return specifier + "";
        };

        return format;
      }

      function formatPrefix(specifier, value) {
        var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
            e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
            k = Math.pow(10, -e),
            prefix = prefixes[8 + e / 3];
        return function(value) {
          return f(k * value) + prefix;
        };
      }

      return {
        format: newFormat,
        formatPrefix: formatPrefix
      };
    }

    var locale;
    var format;
    var formatPrefix;

    defaultLocale({
      thousands: ",",
      grouping: [3],
      currency: ["$", ""]
    });

    function defaultLocale(definition) {
      locale = formatLocale(definition);
      format = locale.format;
      formatPrefix = locale.formatPrefix;
      return locale;
    }

    function precisionFixed(step) {
      return Math.max(0, -exponent(Math.abs(step)));
    }

    function precisionPrefix(step, value) {
      return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3 - exponent(Math.abs(step)));
    }

    function precisionRound(step, max) {
      step = Math.abs(step), max = Math.abs(max) - step;
      return Math.max(0, exponent(max) - exponent(step)) + 1;
    }

    function tickFormat(start, stop, count, specifier) {
      var step = tickStep(start, stop, count),
          precision;
      specifier = formatSpecifier(specifier == null ? ",f" : specifier);
      switch (specifier.type) {
        case "s": {
          var value = Math.max(Math.abs(start), Math.abs(stop));
          if (specifier.precision == null && !isNaN(precision = precisionPrefix(step, value))) specifier.precision = precision;
          return formatPrefix(specifier, value);
        }
        case "":
        case "e":
        case "g":
        case "p":
        case "r": {
          if (specifier.precision == null && !isNaN(precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
          break;
        }
        case "f":
        case "%": {
          if (specifier.precision == null && !isNaN(precision = precisionFixed(step))) specifier.precision = precision - (specifier.type === "%") * 2;
          break;
        }
      }
      return format(specifier);
    }

    function linearish(scale) {
      var domain = scale.domain;

      scale.ticks = function(count) {
        var d = domain();
        return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
      };

      scale.tickFormat = function(count, specifier) {
        var d = domain();
        return tickFormat(d[0], d[d.length - 1], count == null ? 10 : count, specifier);
      };

      scale.nice = function(count) {
        if (count == null) count = 10;

        var d = domain();
        var i0 = 0;
        var i1 = d.length - 1;
        var start = d[i0];
        var stop = d[i1];
        var prestep;
        var step;
        var maxIter = 10;

        if (stop < start) {
          step = start, start = stop, stop = step;
          step = i0, i0 = i1, i1 = step;
        }
        
        while (maxIter-- > 0) {
          step = tickIncrement(start, stop, count);
          if (step === prestep) {
            d[i0] = start;
            d[i1] = stop;
            return domain(d);
          } else if (step > 0) {
            start = Math.floor(start / step) * step;
            stop = Math.ceil(stop / step) * step;
          } else if (step < 0) {
            start = Math.ceil(start * step) / step;
            stop = Math.floor(stop * step) / step;
          } else {
            break;
          }
          prestep = step;
        }

        return scale;
      };

      return scale;
    }

    function linear$1() {
      var scale = continuous();

      scale.copy = function() {
        return copy(scale, linear$1());
      };

      initRange.apply(scale, arguments);

      return linearish(scale);
    }

    function transformPow(exponent) {
      return function(x) {
        return x < 0 ? -Math.pow(-x, exponent) : Math.pow(x, exponent);
      };
    }

    function transformSqrt(x) {
      return x < 0 ? -Math.sqrt(-x) : Math.sqrt(x);
    }

    function transformSquare(x) {
      return x < 0 ? -x * x : x * x;
    }

    function powish(transform) {
      var scale = transform(identity, identity),
          exponent = 1;

      function rescale() {
        return exponent === 1 ? transform(identity, identity)
            : exponent === 0.5 ? transform(transformSqrt, transformSquare)
            : transform(transformPow(exponent), transformPow(1 / exponent));
      }

      scale.exponent = function(_) {
        return arguments.length ? (exponent = +_, rescale()) : exponent;
      };

      return linearish(scale);
    }

    function pow() {
      var scale = powish(transformer());

      scale.copy = function() {
        return copy(scale, pow()).exponent(scale.exponent());
      };

      initRange.apply(scale, arguments);

      return scale;
    }

    function sqrt() {
      return pow.apply(null, arguments).exponent(0.5);
    }

    var defaultScales = {
    	x: linear$1,
    	y: linear$1,
    	z: linear$1,
    	r: sqrt
    };

    /* --------------------------------------------
     *
     * Determine whether a scale is a log, symlog, power or other
     * This is not meant to be exhaustive of all the different types of
     * scales in d3-scale and focuses on continuous scales
     *
     * --------------------------------------------
     */
    function findScaleType(scale) {
    	if (scale.constant) {
    		return 'symlog';
    	}
    	if (scale.base) {
    		return 'log';
    	}
    	if (scale.exponent) {
    		if (scale.exponent() === 0.5) {
    			return 'sqrt';
    		}
    		return 'pow';
    	}
    	return 'other';
    }

    function identity$2 (d) {
    	return d;
    }

    function log(sign) {
    	return x => Math.log(sign * x);
    }

    function exp(sign) {
    	return x => sign * Math.exp(x);
    }

    function symlog(c) {
    	return x => Math.sign(x) * Math.log1p(Math.abs(x / c));
    }

    function symexp(c) {
    	return x => Math.sign(x) * Math.expm1(Math.abs(x)) * c;
    }

    function pow$1(exponent) {
    	return function powFn(x) {
    		return x < 0 ? -Math.pow(-x, exponent) : Math.pow(x, exponent);
    	};
    }

    function getPadFunctions(scale) {
    	const scaleType = findScaleType(scale);

    	if (scaleType === 'log') {
    		const sign = Math.sign(scale.domain()[0]);
    		return { lift: log(sign), ground: exp(sign), scaleType };
    	}
    	if (scaleType === 'pow') {
    		const exponent = 1;
    		return { lift: pow$1(exponent), ground: pow$1(1 / exponent), scaleType };
    	}
    	if (scaleType === 'sqrt') {
    		const exponent = 0.5;
    		return { lift: pow$1(exponent), ground: pow$1(1 / exponent), scaleType };
    	}
    	if (scaleType === 'symlog') {
    		const constant = 1;
    		return { lift: symlog(constant), ground: symexp(constant), scaleType };
    	}

    	return { lift: identity$2, ground: identity$2, scaleType };
    }

    /* --------------------------------------------
     *
     * Returns a modified scale domain by in/decreasing
     * the min/max by taking the desired difference
     * in pixels and converting it to units of data.
     * Returns an array that you can set as the new domain.
     * Padding contributed by @veltman.
     * See here for discussion of transforms: https://github.com/d3/d3-scale/issues/150
     *
     * --------------------------------------------
     */

    function padScale (scale, padding) {
    	if (typeof scale.range !== 'function') {
    		throw new Error('Scale method `range` must be a function');
    	}
    	if (typeof scale.domain !== 'function') {
    		throw new Error('Scale method `domain` must be a function');
    	}
    	if (!Array.isArray(padding)) {
    		return scale.domain();
    	}

    	if (scale.domain().length !== 2) {
    		console.warn('[LayerCake] The scale is expected to have a domain of length 2 to use padding. Are you sure you want to use padding? Your scale\'s domain is:', scale.domain());
    	}
    	if (scale.range().length !== 2) {
    		console.warn('[LayerCake] The scale is expected to have a range of length 2 to use padding. Are you sure you want to use padding? Your scale\'s range is:', scale.range());
    	}

    	const { lift, ground } = getPadFunctions(scale);

    	const d0 = scale.domain()[0];

    	const isTime = Object.prototype.toString.call(d0) === '[object Date]';

    	const [d1, d2] = scale.domain().map(d => {
    		return isTime ? lift(d.getTime()) : lift(d);
    	});
    	const [r1, r2] = scale.range();
    	const paddingLeft = padding[0] || 0;
    	const paddingRight = padding[1] || 0;

    	const step = (d2 - d1) / (Math.abs(r2 - r1) - paddingLeft - paddingRight); // Math.abs() to properly handle reversed scales

    	return [d1 - paddingLeft * step, paddingRight * step + d2].map(d => {
    		return isTime ? ground(new Date(d)) : ground(d);
    	});
    }

    /* eslint-disable no-nested-ternary */
    function calcBaseRange(s, width, height, reverse, percentRange) {
    	let min;
    	let max;
    	if (percentRange === true) {
    		min = 0;
    		max = 100;
    	} else {
    		min = s === 'r' ? 1 : 0;
    		max = s === 'y' ? height : s === 'r' ? 25 : width;
    	}
    	return reverse === true ? [max, min] : [min, max];
    }

    function getDefaultRange(s, width, height, reverse, range, percentRange) {
    	return !range
    		? calcBaseRange(s, width, height, reverse, percentRange)
    		: typeof range === 'function'
    			? range({ width, height })
    			: range;
    }

    function createScale (s) {
    	return function scaleCreator ([$scale, $extents, $domain, $padding, $nice, $reverse, $width, $height, $range, $percentScale]) {
    		if ($extents === null) {
    			return null;
    		}

    		const defaultRange = getDefaultRange(s, $width, $height, $reverse, $range, $percentScale);

    		const scale = $scale === defaultScales[s] ? $scale() : $scale.copy();

    		/* --------------------------------------------
    		 * On creation, `$domain` will already have any nulls filled in
    		 * But if we set it via the context it might not, so rerun it through partialDomain
    		 */
    		scale
    			.domain(partialDomain($extents[s], $domain))
    			.range(defaultRange);

    		if ($padding) {
    			scale.domain(padScale(scale, $padding));
    		}

    		if ($nice === true) {
    			if (typeof scale.nice === 'function') {
    				scale.nice();
    			} else {
    				console.error(`[Layer Cake] You set \`${s}Nice: true\` but the ${s}Scale does not have a \`.nice\` method. Ignoring...`);
    			}
    		}

    		return scale;
    	};
    }

    function createGetter ([$acc, $scale]) {
    	return d => {
    		const val = $acc(d);
    		if (Array.isArray(val)) {
    			return val.map(v => $scale(v));
    		}
    		return $scale(val);
    	};
    }

    function getRange([$scale]) {
    	if (typeof $scale === 'function') {
    		if (typeof $scale.range === 'function') {
    			return $scale.range();
    		}
    		console.error('[LayerCake] Your scale doesn\'t have a `.range` method?');
    	}
    	return null;
    }

    var defaultReverses = {
    	x: false,
    	y: true,
    	z: false,
    	r: false
    };

    /* node_modules/layercake/src/LayerCake.svelte generated by Svelte v3.32.2 */

    const { Object: Object_1, console: console_1 } = globals;
    const file = "node_modules/layercake/src/LayerCake.svelte";

    const get_default_slot_changes = dirty => ({
    	element: dirty[0] & /*element*/ 4,
    	width: dirty[0] & /*$width_d*/ 64,
    	height: dirty[0] & /*$height_d*/ 128,
    	aspectRatio: dirty[0] & /*$aspectRatio_d*/ 256,
    	containerWidth: dirty[0] & /*$_containerWidth*/ 512,
    	containerHeight: dirty[0] & /*$_containerHeight*/ 1024
    });

    const get_default_slot_context = ctx => ({
    	element: /*element*/ ctx[2],
    	width: /*$width_d*/ ctx[6],
    	height: /*$height_d*/ ctx[7],
    	aspectRatio: /*$aspectRatio_d*/ ctx[8],
    	containerWidth: /*$_containerWidth*/ ctx[9],
    	containerHeight: /*$_containerHeight*/ ctx[10]
    });

    // (295:0) {#if (ssr === true || typeof window !== 'undefined')}
    function create_if_block(ctx) {
    	let div;
    	let div_style_value;
    	let div_resize_listener;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[54].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[53], get_default_slot_context);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "layercake-container svelte-vhzpsp");

    			attr_dev(div, "style", div_style_value = "\n\t\t\tposition:" + /*position*/ ctx[5] + ";\n\t\t\t" + (/*position*/ ctx[5] === "absolute"
    			? "top:0;right:0;bottom:0;left:0;"
    			: "") + "\n\t\t\t" + (/*pointerEvents*/ ctx[4] === false
    			? "pointer-events:none;"
    			: "") + "\n\t\t");

    			add_render_callback(() => /*div_elementresize_handler*/ ctx[56].call(div));
    			add_location(div, file, 295, 1, 9437);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			/*div_binding*/ ctx[55](div);
    			div_resize_listener = add_resize_listener(div, /*div_elementresize_handler*/ ctx[56].bind(div));
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty[0] & /*element, $width_d, $height_d, $aspectRatio_d, $_containerWidth, $_containerHeight*/ 1988 | dirty[1] & /*$$scope*/ 4194304) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[53], dirty, get_default_slot_changes, get_default_slot_context);
    				}
    			}

    			if (!current || dirty[0] & /*position, pointerEvents*/ 48 && div_style_value !== (div_style_value = "\n\t\t\tposition:" + /*position*/ ctx[5] + ";\n\t\t\t" + (/*position*/ ctx[5] === "absolute"
    			? "top:0;right:0;bottom:0;left:0;"
    			: "") + "\n\t\t\t" + (/*pointerEvents*/ ctx[4] === false
    			? "pointer-events:none;"
    			: "") + "\n\t\t")) {
    				attr_dev(div, "style", div_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			/*div_binding*/ ctx[55](null);
    			div_resize_listener();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(295:0) {#if (ssr === true || typeof window !== 'undefined')}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = (/*ssr*/ ctx[3] === true || typeof window !== "undefined") && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*ssr*/ ctx[3] === true || typeof window !== "undefined") {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*ssr*/ 8) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let context;
    	let $width_d;
    	let $height_d;
    	let $aspectRatio_d;
    	let $_containerWidth;
    	let $_containerHeight;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("LayerCake", slots, ['default']);
    	let { ssr = false } = $$props;
    	let { pointerEvents = true } = $$props;
    	let { position = "relative" } = $$props;
    	let { percentRange = false } = $$props;
    	let { width = undefined } = $$props;
    	let { height = undefined } = $$props;
    	let { containerWidth = width || 100 } = $$props;
    	let { containerHeight = height || 100 } = $$props;
    	let { element = undefined } = $$props;
    	let { x = undefined } = $$props;
    	let { y = undefined } = $$props;
    	let { z = undefined } = $$props;
    	let { r = undefined } = $$props;
    	let { custom = {} } = $$props;
    	let { data = [] } = $$props;
    	let { xDomain = undefined } = $$props;
    	let { yDomain = undefined } = $$props;
    	let { zDomain = undefined } = $$props;
    	let { rDomain = undefined } = $$props;
    	let { xNice = false } = $$props;
    	let { yNice = false } = $$props;
    	let { zNice = false } = $$props;
    	let { rNice = false } = $$props;
    	let { xReverse = defaultReverses.x } = $$props;
    	let { yReverse = defaultReverses.y } = $$props;
    	let { zReverse = defaultReverses.z } = $$props;
    	let { rReverse = defaultReverses.r } = $$props;
    	let { xPadding = undefined } = $$props;
    	let { yPadding = undefined } = $$props;
    	let { zPadding = undefined } = $$props;
    	let { rPadding = undefined } = $$props;
    	let { xScale = defaultScales.x } = $$props;
    	let { yScale = defaultScales.y } = $$props;
    	let { zScale = defaultScales.y } = $$props;
    	let { rScale = defaultScales.r } = $$props;
    	let { xRange = undefined } = $$props;
    	let { yRange = undefined } = $$props;
    	let { zRange = undefined } = $$props;
    	let { rRange = undefined } = $$props;
    	let { padding = {} } = $$props;
    	let { extents = {} } = $$props;
    	let { flatData = undefined } = $$props;

    	/* --------------------------------------------
     * Preserve a copy of our passed in settings before we modify them
     * Return this to the user's context so they can reference things if need be
     * Add the active keys since those aren't on our settings object.
     * This is mostly an escape-hatch
     */
    	const config = {};

    	/* --------------------------------------------
     * Make store versions of each parameter
     * Prefix these with `_` to keep things organized
     */
    	const _percentRange = writable();

    	const _containerWidth = writable();
    	validate_store(_containerWidth, "_containerWidth");
    	component_subscribe($$self, _containerWidth, value => $$invalidate(9, $_containerWidth = value));
    	const _containerHeight = writable();
    	validate_store(_containerHeight, "_containerHeight");
    	component_subscribe($$self, _containerHeight, value => $$invalidate(10, $_containerHeight = value));
    	const _x = writable();
    	const _y = writable();
    	const _z = writable();
    	const _r = writable();
    	const _custom = writable();
    	const _data = writable();
    	const _xDomain = writable();
    	const _yDomain = writable();
    	const _zDomain = writable();
    	const _rDomain = writable();
    	const _xNice = writable();
    	const _yNice = writable();
    	const _zNice = writable();
    	const _rNice = writable();
    	const _xReverse = writable();
    	const _yReverse = writable();
    	const _zReverse = writable();
    	const _rReverse = writable();
    	const _xPadding = writable();
    	const _yPadding = writable();
    	const _zPadding = writable();
    	const _rPadding = writable();
    	const _xScale = writable();
    	const _yScale = writable();
    	const _zScale = writable();
    	const _rScale = writable();
    	const _xRange = writable();
    	const _yRange = writable();
    	const _zRange = writable();
    	const _rRange = writable();
    	const _padding = writable();
    	const _flatData = writable();
    	const _extents = writable();
    	const _config = writable(config);

    	/* --------------------------------------------
     * Create derived values
     * Suffix these with `_d`
     */
    	const activeGetters_d = derived([_x, _y, _z, _r], ([$x, $y, $z, $r]) => {
    		return [
    			{ field: "x", accessor: $x },
    			{ field: "y", accessor: $y },
    			{ field: "z", accessor: $z },
    			{ field: "r", accessor: $r }
    		].filter(d => d.accessor);
    	});

    	const padding_d = derived([_padding, _containerWidth, _containerHeight], ([$padding]) => {
    		const defaultPadding = { top: 0, right: 0, bottom: 0, left: 0 };
    		return Object.assign(defaultPadding, $padding);
    	});

    	const box_d = derived([_containerWidth, _containerHeight, padding_d], ([$containerWidth, $containerHeight, $padding]) => {
    		const b = {};
    		b.top = $padding.top;
    		b.right = $containerWidth - $padding.right;
    		b.bottom = $containerHeight - $padding.bottom;
    		b.left = $padding.left;
    		b.width = b.right - b.left;
    		b.height = b.bottom - b.top;

    		if (b.width <= 0) {
    			console.error("[LayerCake] Target div has zero or negative width. Did you forget to set an explicit width in CSS on the container?");
    		}

    		if (b.height <= 0) {
    			console.error("[LayerCake] Target div has zero or negative height. Did you forget to set an explicit height in CSS on the container?");
    		}

    		return b;
    	});

    	const width_d = derived([box_d], ([$box]) => {
    		return $box.width;
    	});

    	validate_store(width_d, "width_d");
    	component_subscribe($$self, width_d, value => $$invalidate(6, $width_d = value));

    	const height_d = derived([box_d], ([$box]) => {
    		return $box.height;
    	});

    	validate_store(height_d, "height_d");
    	component_subscribe($$self, height_d, value => $$invalidate(7, $height_d = value));

    	/* --------------------------------------------
     * Calculate extents by taking the extent of the data
     * and filling that in with anything set by the user
     */
    	const extents_d = derived([_flatData, activeGetters_d, _extents], ([$flatData, $activeGetters, $extents]) => {
    		return {
    			...calcExtents($flatData, $activeGetters.filter(d => !$extents[d.field])),
    			...$extents
    		};
    	});

    	const xDomain_d = derived([extents_d, _xDomain], calcDomain("x"));
    	const yDomain_d = derived([extents_d, _yDomain], calcDomain("y"));
    	const zDomain_d = derived([extents_d, _zDomain], calcDomain("z"));
    	const rDomain_d = derived([extents_d, _rDomain], calcDomain("r"));

    	const xScale_d = derived(
    		[
    			_xScale,
    			extents_d,
    			xDomain_d,
    			_xPadding,
    			_xNice,
    			_xReverse,
    			width_d,
    			height_d,
    			_xRange,
    			_percentRange
    		],
    		createScale("x")
    	);

    	const xGet_d = derived([_x, xScale_d], createGetter);

    	const yScale_d = derived(
    		[
    			_yScale,
    			extents_d,
    			yDomain_d,
    			_yPadding,
    			_yNice,
    			_yReverse,
    			width_d,
    			height_d,
    			_yRange,
    			_percentRange
    		],
    		createScale("y")
    	);

    	const yGet_d = derived([_y, yScale_d], createGetter);

    	const zScale_d = derived(
    		[
    			_zScale,
    			extents_d,
    			zDomain_d,
    			_zPadding,
    			_zNice,
    			_zReverse,
    			width_d,
    			height_d,
    			_zRange,
    			_percentRange
    		],
    		createScale("z")
    	);

    	const zGet_d = derived([_z, zScale_d], createGetter);

    	const rScale_d = derived(
    		[
    			_rScale,
    			extents_d,
    			rDomain_d,
    			_rPadding,
    			_rNice,
    			_rReverse,
    			width_d,
    			height_d,
    			_rRange,
    			_percentRange
    		],
    		createScale("r")
    	);

    	const rGet_d = derived([_r, rScale_d], createGetter);
    	const xRange_d = derived([xScale_d], getRange);
    	const yRange_d = derived([yScale_d], getRange);
    	const zRange_d = derived([zScale_d], getRange);
    	const rRange_d = derived([rScale_d], getRange);

    	const aspectRatio_d = derived([width_d, height_d], ([$aspectRatio, $width, $height]) => {
    		return $width / $height;
    	});

    	validate_store(aspectRatio_d, "aspectRatio_d");
    	component_subscribe($$self, aspectRatio_d, value => $$invalidate(8, $aspectRatio_d = value));

    	const writable_props = [
    		"ssr",
    		"pointerEvents",
    		"position",
    		"percentRange",
    		"width",
    		"height",
    		"containerWidth",
    		"containerHeight",
    		"element",
    		"x",
    		"y",
    		"z",
    		"r",
    		"custom",
    		"data",
    		"xDomain",
    		"yDomain",
    		"zDomain",
    		"rDomain",
    		"xNice",
    		"yNice",
    		"zNice",
    		"rNice",
    		"xReverse",
    		"yReverse",
    		"zReverse",
    		"rReverse",
    		"xPadding",
    		"yPadding",
    		"zPadding",
    		"rPadding",
    		"xScale",
    		"yScale",
    		"zScale",
    		"rScale",
    		"xRange",
    		"yRange",
    		"zRange",
    		"rRange",
    		"padding",
    		"extents",
    		"flatData"
    	];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<LayerCake> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			element = $$value;
    			$$invalidate(2, element);
    		});
    	}

    	function div_elementresize_handler() {
    		containerWidth = this.clientWidth;
    		containerHeight = this.clientHeight;
    		$$invalidate(0, containerWidth);
    		$$invalidate(1, containerHeight);
    	}

    	$$self.$$set = $$props => {
    		if ("ssr" in $$props) $$invalidate(3, ssr = $$props.ssr);
    		if ("pointerEvents" in $$props) $$invalidate(4, pointerEvents = $$props.pointerEvents);
    		if ("position" in $$props) $$invalidate(5, position = $$props.position);
    		if ("percentRange" in $$props) $$invalidate(16, percentRange = $$props.percentRange);
    		if ("width" in $$props) $$invalidate(17, width = $$props.width);
    		if ("height" in $$props) $$invalidate(18, height = $$props.height);
    		if ("containerWidth" in $$props) $$invalidate(0, containerWidth = $$props.containerWidth);
    		if ("containerHeight" in $$props) $$invalidate(1, containerHeight = $$props.containerHeight);
    		if ("element" in $$props) $$invalidate(2, element = $$props.element);
    		if ("x" in $$props) $$invalidate(19, x = $$props.x);
    		if ("y" in $$props) $$invalidate(20, y = $$props.y);
    		if ("z" in $$props) $$invalidate(21, z = $$props.z);
    		if ("r" in $$props) $$invalidate(22, r = $$props.r);
    		if ("custom" in $$props) $$invalidate(23, custom = $$props.custom);
    		if ("data" in $$props) $$invalidate(24, data = $$props.data);
    		if ("xDomain" in $$props) $$invalidate(25, xDomain = $$props.xDomain);
    		if ("yDomain" in $$props) $$invalidate(26, yDomain = $$props.yDomain);
    		if ("zDomain" in $$props) $$invalidate(27, zDomain = $$props.zDomain);
    		if ("rDomain" in $$props) $$invalidate(28, rDomain = $$props.rDomain);
    		if ("xNice" in $$props) $$invalidate(29, xNice = $$props.xNice);
    		if ("yNice" in $$props) $$invalidate(30, yNice = $$props.yNice);
    		if ("zNice" in $$props) $$invalidate(31, zNice = $$props.zNice);
    		if ("rNice" in $$props) $$invalidate(32, rNice = $$props.rNice);
    		if ("xReverse" in $$props) $$invalidate(33, xReverse = $$props.xReverse);
    		if ("yReverse" in $$props) $$invalidate(34, yReverse = $$props.yReverse);
    		if ("zReverse" in $$props) $$invalidate(35, zReverse = $$props.zReverse);
    		if ("rReverse" in $$props) $$invalidate(36, rReverse = $$props.rReverse);
    		if ("xPadding" in $$props) $$invalidate(37, xPadding = $$props.xPadding);
    		if ("yPadding" in $$props) $$invalidate(38, yPadding = $$props.yPadding);
    		if ("zPadding" in $$props) $$invalidate(39, zPadding = $$props.zPadding);
    		if ("rPadding" in $$props) $$invalidate(40, rPadding = $$props.rPadding);
    		if ("xScale" in $$props) $$invalidate(41, xScale = $$props.xScale);
    		if ("yScale" in $$props) $$invalidate(42, yScale = $$props.yScale);
    		if ("zScale" in $$props) $$invalidate(43, zScale = $$props.zScale);
    		if ("rScale" in $$props) $$invalidate(44, rScale = $$props.rScale);
    		if ("xRange" in $$props) $$invalidate(45, xRange = $$props.xRange);
    		if ("yRange" in $$props) $$invalidate(46, yRange = $$props.yRange);
    		if ("zRange" in $$props) $$invalidate(47, zRange = $$props.zRange);
    		if ("rRange" in $$props) $$invalidate(48, rRange = $$props.rRange);
    		if ("padding" in $$props) $$invalidate(49, padding = $$props.padding);
    		if ("extents" in $$props) $$invalidate(50, extents = $$props.extents);
    		if ("flatData" in $$props) $$invalidate(51, flatData = $$props.flatData);
    		if ("$$scope" in $$props) $$invalidate(53, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		setContext,
    		writable,
    		derived,
    		makeAccessor,
    		filterObject,
    		calcExtents,
    		calcDomain,
    		createScale,
    		createGetter,
    		getRange,
    		defaultScales,
    		defaultReverses,
    		ssr,
    		pointerEvents,
    		position,
    		percentRange,
    		width,
    		height,
    		containerWidth,
    		containerHeight,
    		element,
    		x,
    		y,
    		z,
    		r,
    		custom,
    		data,
    		xDomain,
    		yDomain,
    		zDomain,
    		rDomain,
    		xNice,
    		yNice,
    		zNice,
    		rNice,
    		xReverse,
    		yReverse,
    		zReverse,
    		rReverse,
    		xPadding,
    		yPadding,
    		zPadding,
    		rPadding,
    		xScale,
    		yScale,
    		zScale,
    		rScale,
    		xRange,
    		yRange,
    		zRange,
    		rRange,
    		padding,
    		extents,
    		flatData,
    		config,
    		_percentRange,
    		_containerWidth,
    		_containerHeight,
    		_x,
    		_y,
    		_z,
    		_r,
    		_custom,
    		_data,
    		_xDomain,
    		_yDomain,
    		_zDomain,
    		_rDomain,
    		_xNice,
    		_yNice,
    		_zNice,
    		_rNice,
    		_xReverse,
    		_yReverse,
    		_zReverse,
    		_rReverse,
    		_xPadding,
    		_yPadding,
    		_zPadding,
    		_rPadding,
    		_xScale,
    		_yScale,
    		_zScale,
    		_rScale,
    		_xRange,
    		_yRange,
    		_zRange,
    		_rRange,
    		_padding,
    		_flatData,
    		_extents,
    		_config,
    		activeGetters_d,
    		padding_d,
    		box_d,
    		width_d,
    		height_d,
    		extents_d,
    		xDomain_d,
    		yDomain_d,
    		zDomain_d,
    		rDomain_d,
    		xScale_d,
    		xGet_d,
    		yScale_d,
    		yGet_d,
    		zScale_d,
    		zGet_d,
    		rScale_d,
    		rGet_d,
    		xRange_d,
    		yRange_d,
    		zRange_d,
    		rRange_d,
    		aspectRatio_d,
    		context,
    		$width_d,
    		$height_d,
    		$aspectRatio_d,
    		$_containerWidth,
    		$_containerHeight
    	});

    	$$self.$inject_state = $$props => {
    		if ("ssr" in $$props) $$invalidate(3, ssr = $$props.ssr);
    		if ("pointerEvents" in $$props) $$invalidate(4, pointerEvents = $$props.pointerEvents);
    		if ("position" in $$props) $$invalidate(5, position = $$props.position);
    		if ("percentRange" in $$props) $$invalidate(16, percentRange = $$props.percentRange);
    		if ("width" in $$props) $$invalidate(17, width = $$props.width);
    		if ("height" in $$props) $$invalidate(18, height = $$props.height);
    		if ("containerWidth" in $$props) $$invalidate(0, containerWidth = $$props.containerWidth);
    		if ("containerHeight" in $$props) $$invalidate(1, containerHeight = $$props.containerHeight);
    		if ("element" in $$props) $$invalidate(2, element = $$props.element);
    		if ("x" in $$props) $$invalidate(19, x = $$props.x);
    		if ("y" in $$props) $$invalidate(20, y = $$props.y);
    		if ("z" in $$props) $$invalidate(21, z = $$props.z);
    		if ("r" in $$props) $$invalidate(22, r = $$props.r);
    		if ("custom" in $$props) $$invalidate(23, custom = $$props.custom);
    		if ("data" in $$props) $$invalidate(24, data = $$props.data);
    		if ("xDomain" in $$props) $$invalidate(25, xDomain = $$props.xDomain);
    		if ("yDomain" in $$props) $$invalidate(26, yDomain = $$props.yDomain);
    		if ("zDomain" in $$props) $$invalidate(27, zDomain = $$props.zDomain);
    		if ("rDomain" in $$props) $$invalidate(28, rDomain = $$props.rDomain);
    		if ("xNice" in $$props) $$invalidate(29, xNice = $$props.xNice);
    		if ("yNice" in $$props) $$invalidate(30, yNice = $$props.yNice);
    		if ("zNice" in $$props) $$invalidate(31, zNice = $$props.zNice);
    		if ("rNice" in $$props) $$invalidate(32, rNice = $$props.rNice);
    		if ("xReverse" in $$props) $$invalidate(33, xReverse = $$props.xReverse);
    		if ("yReverse" in $$props) $$invalidate(34, yReverse = $$props.yReverse);
    		if ("zReverse" in $$props) $$invalidate(35, zReverse = $$props.zReverse);
    		if ("rReverse" in $$props) $$invalidate(36, rReverse = $$props.rReverse);
    		if ("xPadding" in $$props) $$invalidate(37, xPadding = $$props.xPadding);
    		if ("yPadding" in $$props) $$invalidate(38, yPadding = $$props.yPadding);
    		if ("zPadding" in $$props) $$invalidate(39, zPadding = $$props.zPadding);
    		if ("rPadding" in $$props) $$invalidate(40, rPadding = $$props.rPadding);
    		if ("xScale" in $$props) $$invalidate(41, xScale = $$props.xScale);
    		if ("yScale" in $$props) $$invalidate(42, yScale = $$props.yScale);
    		if ("zScale" in $$props) $$invalidate(43, zScale = $$props.zScale);
    		if ("rScale" in $$props) $$invalidate(44, rScale = $$props.rScale);
    		if ("xRange" in $$props) $$invalidate(45, xRange = $$props.xRange);
    		if ("yRange" in $$props) $$invalidate(46, yRange = $$props.yRange);
    		if ("zRange" in $$props) $$invalidate(47, zRange = $$props.zRange);
    		if ("rRange" in $$props) $$invalidate(48, rRange = $$props.rRange);
    		if ("padding" in $$props) $$invalidate(49, padding = $$props.padding);
    		if ("extents" in $$props) $$invalidate(50, extents = $$props.extents);
    		if ("flatData" in $$props) $$invalidate(51, flatData = $$props.flatData);
    		if ("context" in $$props) $$invalidate(52, context = $$props.context);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*x*/ 524288) {
    			if (x) config.x = x;
    		}

    		if ($$self.$$.dirty[0] & /*y*/ 1048576) {
    			if (y) config.y = y;
    		}

    		if ($$self.$$.dirty[0] & /*z*/ 2097152) {
    			if (z) config.z = z;
    		}

    		if ($$self.$$.dirty[0] & /*r*/ 4194304) {
    			if (r) config.r = r;
    		}

    		if ($$self.$$.dirty[0] & /*xDomain*/ 33554432) {
    			if (xDomain) config.xDomain = xDomain;
    		}

    		if ($$self.$$.dirty[0] & /*yDomain*/ 67108864) {
    			if (yDomain) config.yDomain = yDomain;
    		}

    		if ($$self.$$.dirty[0] & /*zDomain*/ 134217728) {
    			if (zDomain) config.zDomain = zDomain;
    		}

    		if ($$self.$$.dirty[0] & /*rDomain*/ 268435456) {
    			if (rDomain) config.rDomain = rDomain;
    		}

    		if ($$self.$$.dirty[1] & /*xRange*/ 16384) {
    			if (xRange) config.xRange = xRange;
    		}

    		if ($$self.$$.dirty[1] & /*yRange*/ 32768) {
    			if (yRange) config.yRange = yRange;
    		}

    		if ($$self.$$.dirty[1] & /*zRange*/ 65536) {
    			if (zRange) config.zRange = zRange;
    		}

    		if ($$self.$$.dirty[1] & /*rRange*/ 131072) {
    			if (rRange) config.rRange = rRange;
    		}

    		if ($$self.$$.dirty[0] & /*percentRange*/ 65536) {
    			_percentRange.set(percentRange);
    		}

    		if ($$self.$$.dirty[0] & /*containerWidth*/ 1) {
    			_containerWidth.set(containerWidth);
    		}

    		if ($$self.$$.dirty[0] & /*containerHeight*/ 2) {
    			_containerHeight.set(containerHeight);
    		}

    		if ($$self.$$.dirty[0] & /*x*/ 524288) {
    			_x.set(makeAccessor(x));
    		}

    		if ($$self.$$.dirty[0] & /*y*/ 1048576) {
    			_y.set(makeAccessor(y));
    		}

    		if ($$self.$$.dirty[0] & /*z*/ 2097152) {
    			_z.set(makeAccessor(z));
    		}

    		if ($$self.$$.dirty[0] & /*r*/ 4194304) {
    			_r.set(makeAccessor(r));
    		}

    		if ($$self.$$.dirty[0] & /*xDomain*/ 33554432) {
    			_xDomain.set(xDomain);
    		}

    		if ($$self.$$.dirty[0] & /*yDomain*/ 67108864) {
    			_yDomain.set(yDomain);
    		}

    		if ($$self.$$.dirty[0] & /*zDomain*/ 134217728) {
    			_zDomain.set(zDomain);
    		}

    		if ($$self.$$.dirty[0] & /*rDomain*/ 268435456) {
    			_rDomain.set(rDomain);
    		}

    		if ($$self.$$.dirty[0] & /*custom*/ 8388608) {
    			_custom.set(custom);
    		}

    		if ($$self.$$.dirty[0] & /*data*/ 16777216) {
    			_data.set(data);
    		}

    		if ($$self.$$.dirty[0] & /*xNice*/ 536870912) {
    			_xNice.set(xNice);
    		}

    		if ($$self.$$.dirty[0] & /*yNice*/ 1073741824) {
    			_yNice.set(yNice);
    		}

    		if ($$self.$$.dirty[1] & /*zNice*/ 1) {
    			_zNice.set(zNice);
    		}

    		if ($$self.$$.dirty[1] & /*rNice*/ 2) {
    			_rNice.set(rNice);
    		}

    		if ($$self.$$.dirty[1] & /*xReverse*/ 4) {
    			_xReverse.set(xReverse);
    		}

    		if ($$self.$$.dirty[1] & /*yReverse*/ 8) {
    			_yReverse.set(yReverse);
    		}

    		if ($$self.$$.dirty[1] & /*zReverse*/ 16) {
    			_zReverse.set(zReverse);
    		}

    		if ($$self.$$.dirty[1] & /*rReverse*/ 32) {
    			_rReverse.set(rReverse);
    		}

    		if ($$self.$$.dirty[1] & /*xPadding*/ 64) {
    			_xPadding.set(xPadding);
    		}

    		if ($$self.$$.dirty[1] & /*yPadding*/ 128) {
    			_yPadding.set(yPadding);
    		}

    		if ($$self.$$.dirty[1] & /*zPadding*/ 256) {
    			_zPadding.set(zPadding);
    		}

    		if ($$self.$$.dirty[1] & /*rPadding*/ 512) {
    			_rPadding.set(rPadding);
    		}

    		if ($$self.$$.dirty[1] & /*xScale*/ 1024) {
    			_xScale.set(xScale);
    		}

    		if ($$self.$$.dirty[1] & /*yScale*/ 2048) {
    			_yScale.set(yScale);
    		}

    		if ($$self.$$.dirty[1] & /*zScale*/ 4096) {
    			_zScale.set(zScale);
    		}

    		if ($$self.$$.dirty[1] & /*rScale*/ 8192) {
    			_rScale.set(rScale);
    		}

    		if ($$self.$$.dirty[1] & /*xRange*/ 16384) {
    			_xRange.set(xRange);
    		}

    		if ($$self.$$.dirty[1] & /*yRange*/ 32768) {
    			_yRange.set(yRange);
    		}

    		if ($$self.$$.dirty[1] & /*zRange*/ 65536) {
    			_zRange.set(zRange);
    		}

    		if ($$self.$$.dirty[1] & /*rRange*/ 131072) {
    			_rRange.set(rRange);
    		}

    		if ($$self.$$.dirty[1] & /*padding*/ 262144) {
    			_padding.set(padding);
    		}

    		if ($$self.$$.dirty[1] & /*extents*/ 524288) {
    			_extents.set(filterObject(extents));
    		}

    		if ($$self.$$.dirty[0] & /*data*/ 16777216 | $$self.$$.dirty[1] & /*flatData*/ 1048576) {
    			_flatData.set(flatData || data);
    		}

    		if ($$self.$$.dirty[1] & /*context*/ 2097152) {
    			setContext("LayerCake", context);
    		}
    	};

    	$$invalidate(52, context = {
    		activeGetters: activeGetters_d,
    		width: width_d,
    		height: height_d,
    		percentRange: _percentRange,
    		aspectRatio: aspectRatio_d,
    		containerWidth: _containerWidth,
    		containerHeight: _containerHeight,
    		x: _x,
    		y: _y,
    		z: _z,
    		r: _r,
    		custom: _custom,
    		data: _data,
    		xNice: _xNice,
    		yNice: _yNice,
    		zNice: _zNice,
    		rNice: _rNice,
    		xReverse: _xReverse,
    		yReverse: _yReverse,
    		zReverse: _zReverse,
    		rReverse: _rReverse,
    		xPadding: _xPadding,
    		yPadding: _yPadding,
    		zPadding: _zPadding,
    		rPadding: _rPadding,
    		padding: padding_d,
    		flatData: _flatData,
    		extents: extents_d,
    		xDomain: xDomain_d,
    		yDomain: yDomain_d,
    		zDomain: zDomain_d,
    		rDomain: rDomain_d,
    		xRange: xRange_d,
    		yRange: yRange_d,
    		zRange: zRange_d,
    		rRange: rRange_d,
    		config: _config,
    		xScale: xScale_d,
    		xGet: xGet_d,
    		yScale: yScale_d,
    		yGet: yGet_d,
    		zScale: zScale_d,
    		zGet: zGet_d,
    		rScale: rScale_d,
    		rGet: rGet_d
    	});

    	return [
    		containerWidth,
    		containerHeight,
    		element,
    		ssr,
    		pointerEvents,
    		position,
    		$width_d,
    		$height_d,
    		$aspectRatio_d,
    		$_containerWidth,
    		$_containerHeight,
    		_containerWidth,
    		_containerHeight,
    		width_d,
    		height_d,
    		aspectRatio_d,
    		percentRange,
    		width,
    		height,
    		x,
    		y,
    		z,
    		r,
    		custom,
    		data,
    		xDomain,
    		yDomain,
    		zDomain,
    		rDomain,
    		xNice,
    		yNice,
    		zNice,
    		rNice,
    		xReverse,
    		yReverse,
    		zReverse,
    		rReverse,
    		xPadding,
    		yPadding,
    		zPadding,
    		rPadding,
    		xScale,
    		yScale,
    		zScale,
    		rScale,
    		xRange,
    		yRange,
    		zRange,
    		rRange,
    		padding,
    		extents,
    		flatData,
    		context,
    		$$scope,
    		slots,
    		div_binding,
    		div_elementresize_handler
    	];
    }

    class LayerCake extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance,
    			create_fragment,
    			safe_not_equal,
    			{
    				ssr: 3,
    				pointerEvents: 4,
    				position: 5,
    				percentRange: 16,
    				width: 17,
    				height: 18,
    				containerWidth: 0,
    				containerHeight: 1,
    				element: 2,
    				x: 19,
    				y: 20,
    				z: 21,
    				r: 22,
    				custom: 23,
    				data: 24,
    				xDomain: 25,
    				yDomain: 26,
    				zDomain: 27,
    				rDomain: 28,
    				xNice: 29,
    				yNice: 30,
    				zNice: 31,
    				rNice: 32,
    				xReverse: 33,
    				yReverse: 34,
    				zReverse: 35,
    				rReverse: 36,
    				xPadding: 37,
    				yPadding: 38,
    				zPadding: 39,
    				rPadding: 40,
    				xScale: 41,
    				yScale: 42,
    				zScale: 43,
    				rScale: 44,
    				xRange: 45,
    				yRange: 46,
    				zRange: 47,
    				rRange: 48,
    				padding: 49,
    				extents: 50,
    				flatData: 51
    			},
    			[-1, -1, -1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LayerCake",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get ssr() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ssr(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pointerEvents() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pointerEvents(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get position() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set position(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get percentRange() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set percentRange(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get containerWidth() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set containerWidth(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get containerHeight() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set containerHeight(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get element() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set element(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get x() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get z() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set z(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get r() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set r(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get custom() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set custom(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xDomain() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xDomain(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get yDomain() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set yDomain(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get zDomain() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set zDomain(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rDomain() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rDomain(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xNice() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xNice(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get yNice() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set yNice(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get zNice() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set zNice(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rNice() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rNice(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xReverse() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xReverse(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get yReverse() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set yReverse(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get zReverse() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set zReverse(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rReverse() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rReverse(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xPadding() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xPadding(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get yPadding() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set yPadding(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get zPadding() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set zPadding(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rPadding() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rPadding(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xScale() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xScale(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get yScale() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set yScale(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get zScale() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set zScale(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rScale() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rScale(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xRange() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xRange(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get yRange() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set yRange(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get zRange() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set zRange(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rRange() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rRange(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get padding() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set padding(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get extents() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set extents(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get flatData() {
    		throw new Error("<LayerCake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set flatData(value) {
    		throw new Error("<LayerCake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/layercake/src/layouts/Html.svelte generated by Svelte v3.32.2 */
    const file$1 = "node_modules/layercake/src/layouts/Html.svelte";
    const get_default_slot_changes$1 = dirty => ({ element: dirty & /*element*/ 1 });
    const get_default_slot_context$1 = ctx => ({ element: /*element*/ ctx[0] });

    function create_fragment$1(ctx) {
    	let div;
    	let div_style_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], get_default_slot_context$1);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "layercake-layout-html svelte-1bu60uu");
    			attr_dev(div, "style", div_style_value = "top: " + /*$padding*/ ctx[3].top + "px; right:" + /*$padding*/ ctx[3].right + "px; bottom:" + /*$padding*/ ctx[3].bottom + "px; left:" + /*$padding*/ ctx[3].left + "px;" + /*zIndexStyle*/ ctx[1] + /*pointerEventsStyle*/ ctx[2]);
    			add_location(div, file$1, 16, 0, 422);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			/*div_binding*/ ctx[9](div);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope, element*/ 129) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[7], dirty, get_default_slot_changes$1, get_default_slot_context$1);
    				}
    			}

    			if (!current || dirty & /*$padding, zIndexStyle, pointerEventsStyle*/ 14 && div_style_value !== (div_style_value = "top: " + /*$padding*/ ctx[3].top + "px; right:" + /*$padding*/ ctx[3].right + "px; bottom:" + /*$padding*/ ctx[3].bottom + "px; left:" + /*$padding*/ ctx[3].left + "px;" + /*zIndexStyle*/ ctx[1] + /*pointerEventsStyle*/ ctx[2])) {
    				attr_dev(div, "style", div_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			/*div_binding*/ ctx[9](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $padding;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Html", slots, ['default']);
    	let { element = undefined } = $$props;
    	let { zIndex = undefined } = $$props;
    	let { pointerEvents = undefined } = $$props;
    	let zIndexStyle = "";
    	let pointerEventsStyle = "";
    	const { padding } = getContext("LayerCake");
    	validate_store(padding, "padding");
    	component_subscribe($$self, padding, value => $$invalidate(3, $padding = value));
    	const writable_props = ["element", "zIndex", "pointerEvents"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Html> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			element = $$value;
    			$$invalidate(0, element);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("element" in $$props) $$invalidate(0, element = $$props.element);
    		if ("zIndex" in $$props) $$invalidate(5, zIndex = $$props.zIndex);
    		if ("pointerEvents" in $$props) $$invalidate(6, pointerEvents = $$props.pointerEvents);
    		if ("$$scope" in $$props) $$invalidate(7, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		element,
    		zIndex,
    		pointerEvents,
    		zIndexStyle,
    		pointerEventsStyle,
    		padding,
    		$padding
    	});

    	$$self.$inject_state = $$props => {
    		if ("element" in $$props) $$invalidate(0, element = $$props.element);
    		if ("zIndex" in $$props) $$invalidate(5, zIndex = $$props.zIndex);
    		if ("pointerEvents" in $$props) $$invalidate(6, pointerEvents = $$props.pointerEvents);
    		if ("zIndexStyle" in $$props) $$invalidate(1, zIndexStyle = $$props.zIndexStyle);
    		if ("pointerEventsStyle" in $$props) $$invalidate(2, pointerEventsStyle = $$props.pointerEventsStyle);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*zIndex*/ 32) {
    			$$invalidate(1, zIndexStyle = typeof zIndex !== "undefined"
    			? `z-index:${zIndex};`
    			: "");
    		}

    		if ($$self.$$.dirty & /*pointerEvents*/ 64) {
    			$$invalidate(2, pointerEventsStyle = pointerEvents === false ? "pointer-events:none;" : "");
    		}
    	};

    	return [
    		element,
    		zIndexStyle,
    		pointerEventsStyle,
    		$padding,
    		padding,
    		zIndex,
    		pointerEvents,
    		$$scope,
    		slots,
    		div_binding
    	];
    }

    class Html extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { element: 0, zIndex: 5, pointerEvents: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Html",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get element() {
    		throw new Error("<Html>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set element(value) {
    		throw new Error("<Html>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get zIndex() {
    		throw new Error("<Html>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set zIndex(value) {
    		throw new Error("<Html>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pointerEvents() {
    		throw new Error("<Html>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pointerEvents(value) {
    		throw new Error("<Html>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/layercake/src/layouts/Svg.svelte generated by Svelte v3.32.2 */
    const file$2 = "node_modules/layercake/src/layouts/Svg.svelte";
    const get_default_slot_changes$2 = dirty => ({ element: dirty & /*element*/ 1 });
    const get_default_slot_context$2 = ctx => ({ element: /*element*/ ctx[0] });
    const get_defs_slot_changes = dirty => ({ element: dirty & /*element*/ 1 });
    const get_defs_slot_context = ctx => ({ element: /*element*/ ctx[0] });

    function create_fragment$2(ctx) {
    	let svg;
    	let defs;
    	let g;
    	let g_transform_value;
    	let svg_style_value;
    	let current;
    	const defs_slot_template = /*#slots*/ ctx[13].defs;
    	const defs_slot = create_slot(defs_slot_template, ctx, /*$$scope*/ ctx[12], get_defs_slot_context);
    	const default_slot_template = /*#slots*/ ctx[13].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[12], get_default_slot_context$2);

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			defs = svg_element("defs");
    			if (defs_slot) defs_slot.c();
    			g = svg_element("g");
    			if (default_slot) default_slot.c();
    			add_location(defs, file$2, 24, 1, 652);
    			attr_dev(g, "class", "layercake-layout-svg_g");
    			attr_dev(g, "transform", g_transform_value = "translate(" + /*$padding*/ ctx[6].left + ", " + /*$padding*/ ctx[6].top + ")");
    			add_location(g, file$2, 27, 1, 697);
    			attr_dev(svg, "class", "layercake-layout-svg svelte-u84d8d");
    			attr_dev(svg, "viewBox", /*viewBox*/ ctx[1]);
    			attr_dev(svg, "width", /*$containerWidth*/ ctx[4]);
    			attr_dev(svg, "height", /*$containerHeight*/ ctx[5]);
    			attr_dev(svg, "style", svg_style_value = "" + (/*zIndexStyle*/ ctx[2] + /*pointerEventsStyle*/ ctx[3]));
    			add_location(svg, file$2, 16, 0, 487);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, defs);

    			if (defs_slot) {
    				defs_slot.m(defs, null);
    			}

    			append_dev(svg, g);

    			if (default_slot) {
    				default_slot.m(g, null);
    			}

    			/*svg_binding*/ ctx[14](svg);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (defs_slot) {
    				if (defs_slot.p && dirty & /*$$scope, element*/ 4097) {
    					update_slot(defs_slot, defs_slot_template, ctx, /*$$scope*/ ctx[12], dirty, get_defs_slot_changes, get_defs_slot_context);
    				}
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope, element*/ 4097) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[12], dirty, get_default_slot_changes$2, get_default_slot_context$2);
    				}
    			}

    			if (!current || dirty & /*$padding*/ 64 && g_transform_value !== (g_transform_value = "translate(" + /*$padding*/ ctx[6].left + ", " + /*$padding*/ ctx[6].top + ")")) {
    				attr_dev(g, "transform", g_transform_value);
    			}

    			if (!current || dirty & /*viewBox*/ 2) {
    				attr_dev(svg, "viewBox", /*viewBox*/ ctx[1]);
    			}

    			if (!current || dirty & /*$containerWidth*/ 16) {
    				attr_dev(svg, "width", /*$containerWidth*/ ctx[4]);
    			}

    			if (!current || dirty & /*$containerHeight*/ 32) {
    				attr_dev(svg, "height", /*$containerHeight*/ ctx[5]);
    			}

    			if (!current || dirty & /*zIndexStyle, pointerEventsStyle*/ 12 && svg_style_value !== (svg_style_value = "" + (/*zIndexStyle*/ ctx[2] + /*pointerEventsStyle*/ ctx[3]))) {
    				attr_dev(svg, "style", svg_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(defs_slot, local);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(defs_slot, local);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if (defs_slot) defs_slot.d(detaching);
    			if (default_slot) default_slot.d(detaching);
    			/*svg_binding*/ ctx[14](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $containerWidth;
    	let $containerHeight;
    	let $padding;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Svg", slots, ['defs','default']);
    	let { element = undefined } = $$props;
    	let { viewBox = undefined } = $$props;
    	let { zIndex = undefined } = $$props;
    	let { pointerEvents = undefined } = $$props;
    	let zIndexStyle = "";
    	let pointerEventsStyle = "";
    	const { containerWidth, containerHeight, padding } = getContext("LayerCake");
    	validate_store(containerWidth, "containerWidth");
    	component_subscribe($$self, containerWidth, value => $$invalidate(4, $containerWidth = value));
    	validate_store(containerHeight, "containerHeight");
    	component_subscribe($$self, containerHeight, value => $$invalidate(5, $containerHeight = value));
    	validate_store(padding, "padding");
    	component_subscribe($$self, padding, value => $$invalidate(6, $padding = value));
    	const writable_props = ["element", "viewBox", "zIndex", "pointerEvents"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Svg> was created with unknown prop '${key}'`);
    	});

    	function svg_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			element = $$value;
    			$$invalidate(0, element);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("element" in $$props) $$invalidate(0, element = $$props.element);
    		if ("viewBox" in $$props) $$invalidate(1, viewBox = $$props.viewBox);
    		if ("zIndex" in $$props) $$invalidate(10, zIndex = $$props.zIndex);
    		if ("pointerEvents" in $$props) $$invalidate(11, pointerEvents = $$props.pointerEvents);
    		if ("$$scope" in $$props) $$invalidate(12, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		element,
    		viewBox,
    		zIndex,
    		pointerEvents,
    		zIndexStyle,
    		pointerEventsStyle,
    		containerWidth,
    		containerHeight,
    		padding,
    		$containerWidth,
    		$containerHeight,
    		$padding
    	});

    	$$self.$inject_state = $$props => {
    		if ("element" in $$props) $$invalidate(0, element = $$props.element);
    		if ("viewBox" in $$props) $$invalidate(1, viewBox = $$props.viewBox);
    		if ("zIndex" in $$props) $$invalidate(10, zIndex = $$props.zIndex);
    		if ("pointerEvents" in $$props) $$invalidate(11, pointerEvents = $$props.pointerEvents);
    		if ("zIndexStyle" in $$props) $$invalidate(2, zIndexStyle = $$props.zIndexStyle);
    		if ("pointerEventsStyle" in $$props) $$invalidate(3, pointerEventsStyle = $$props.pointerEventsStyle);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*zIndex*/ 1024) {
    			$$invalidate(2, zIndexStyle = typeof zIndex !== "undefined"
    			? `z-index:${zIndex};`
    			: "");
    		}

    		if ($$self.$$.dirty & /*pointerEvents*/ 2048) {
    			$$invalidate(3, pointerEventsStyle = pointerEvents === false ? "pointer-events:none;" : "");
    		}
    	};

    	return [
    		element,
    		viewBox,
    		zIndexStyle,
    		pointerEventsStyle,
    		$containerWidth,
    		$containerHeight,
    		$padding,
    		containerWidth,
    		containerHeight,
    		padding,
    		zIndex,
    		pointerEvents,
    		$$scope,
    		slots,
    		svg_binding
    	];
    }

    class Svg extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			element: 0,
    			viewBox: 1,
    			zIndex: 10,
    			pointerEvents: 11
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Svg",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get element() {
    		throw new Error("<Svg>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set element(value) {
    		throw new Error("<Svg>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get viewBox() {
    		throw new Error("<Svg>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set viewBox(value) {
    		throw new Error("<Svg>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get zIndex() {
    		throw new Error("<Svg>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set zIndex(value) {
    		throw new Error("<Svg>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pointerEvents() {
    		throw new Error("<Svg>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pointerEvents(value) {
    		throw new Error("<Svg>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* --------------------------------------------
     *
     * Move an element to the last child
     * Adapted from d3-selection `.raise`
     * https://github.com/d3/d3-selection#selection_raise
     *
     * --------------------------------------------
     */
    function raise(el) {
    	if (el.nextSibling) el.parentNode.appendChild(el);
    }

    /* src/components/smarts/MapKey.svelte generated by Svelte v3.32.2 */

    const file$3 = "src/components/smarts/MapKey.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	child_ctx[14] = i;
    	return child_ctx;
    }

    // (28:16) {:else}
    function create_else_block(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "level svelte-1azrjgf");
    			set_style(div0, "background-color", /*color*/ ctx[12]);
    			add_location(div0, file$3, 29, 20, 858);
    			attr_dev(div1, "class", "bar svelte-1azrjgf");
    			add_location(div1, file$3, 28, 16, 820);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(28:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (24:16) {#if (i < colors.length - 1)}
    function create_if_block_2(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "level svelte-1azrjgf");
    			set_style(div0, "background-color", /*color*/ ctx[12]);
    			add_location(div0, file$3, 25, 20, 696);
    			attr_dev(div1, "class", "bar bar-tick svelte-1azrjgf");
    			add_location(div1, file$3, 24, 16, 649);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(24:16) {#if (i < colors.length - 1)}",
    		ctx
    	});

    	return block;
    }

    // (22:12) {#each colors as color, i}
    function create_each_block_1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*i*/ ctx[14] < /*colors*/ ctx[5].length - 1) return create_if_block_2;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(22:12) {#each colors as color, i}",
    		ctx
    	});

    	return block;
    }

    // (37:12) {#if has_missing_data}
    function create_if_block_1(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "level svelte-1azrjgf");
    			set_style(div0, "background-color", /*missing_data_color*/ ctx[3]);
    			add_location(div0, file$3, 38, 20, 1097);
    			attr_dev(div1, "class", "bar bar-last svelte-1azrjgf");
    			add_location(div1, file$3, 37, 16, 1050);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*missing_data_color*/ 8) {
    				set_style(div0, "background-color", /*missing_data_color*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(37:12) {#if has_missing_data}",
    		ctx
    	});

    	return block;
    }

    // (47:12) {#each level_breaks as level_break}
    function create_each_block(ctx) {
    	let div;
    	let span;
    	let t_value = /*level_break*/ ctx[9] + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "svelte-1azrjgf");
    			add_location(span, file$3, 48, 24, 1399);
    			attr_dev(div, "class", "level-label svelte-1azrjgf");
    			add_location(div, file$3, 47, 16, 1349);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(47:12) {#each level_breaks as level_break}",
    		ctx
    	});

    	return block;
    }

    // (53:12) {#if has_missing_data}
    function create_if_block$1(ctx) {
    	let div;
    	let span;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			span.textContent = "No data";
    			attr_dev(span, "class", "svelte-1azrjgf");
    			add_location(span, file$3, 54, 20, 1583);
    			attr_dev(div, "class", "level-label svelte-1azrjgf");
    			add_location(div, file$3, 53, 16, 1537);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(53:12) {#if has_missing_data}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let main;
    	let div4;
    	let div0;
    	let t0;
    	let t1;
    	let div1;
    	let t2;
    	let t3;
    	let div2;
    	let t4;
    	let t5;
    	let div3;
    	let t6;
    	let t7;
    	let p;
    	let t8;
    	let each_value_1 = /*colors*/ ctx[5];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let if_block0 = /*has_missing_data*/ ctx[2] && create_if_block_1(ctx);
    	let each_value = /*level_breaks*/ ctx[6];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let if_block1 = /*has_missing_data*/ ctx[2] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div4 = element("div");
    			div0 = element("div");
    			t0 = text(/*hed*/ ctx[0]);
    			t1 = space();
    			div1 = element("div");
    			t2 = text(/*subhed*/ ctx[1]);
    			t3 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t4 = space();
    			if (if_block0) if_block0.c();
    			t5 = space();
    			div3 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t6 = space();
    			if (if_block1) if_block1.c();
    			t7 = space();
    			p = element("p");
    			t8 = text(/*interaction_tip*/ ctx[4]);
    			attr_dev(div0, "class", "map-key-hed svelte-1azrjgf");
    			add_location(div0, file$3, 16, 8, 410);
    			attr_dev(div1, "class", "map-key-subhed svelte-1azrjgf");
    			add_location(div1, file$3, 17, 8, 455);
    			attr_dev(div2, "class", "bars svelte-1azrjgf");
    			add_location(div2, file$3, 19, 8, 507);
    			attr_dev(div3, "class", "level-labels svelte-1azrjgf");
    			add_location(div3, file$3, 44, 8, 1249);
    			attr_dev(p, "class", "map-interaction-tip svelte-1azrjgf");
    			add_location(p, file$3, 60, 8, 1690);
    			attr_dev(div4, "class", "map-key svelte-1azrjgf");
    			add_location(div4, file$3, 15, 4, 380);
    			add_location(main, file$3, 14, 0, 369);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div4);
    			append_dev(div4, div0);
    			append_dev(div0, t0);
    			append_dev(div4, t1);
    			append_dev(div4, div1);
    			append_dev(div1, t2);
    			append_dev(div4, t3);
    			append_dev(div4, div2);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div2, null);
    			}

    			append_dev(div2, t4);
    			if (if_block0) if_block0.m(div2, null);
    			append_dev(div4, t5);
    			append_dev(div4, div3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}

    			append_dev(div3, t6);
    			if (if_block1) if_block1.m(div3, null);
    			append_dev(div4, t7);
    			append_dev(div4, p);
    			append_dev(p, t8);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*hed*/ 1) set_data_dev(t0, /*hed*/ ctx[0]);
    			if (dirty & /*subhed*/ 2) set_data_dev(t2, /*subhed*/ ctx[1]);

    			if (dirty & /*colors*/ 32) {
    				each_value_1 = /*colors*/ ctx[5];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div2, t4);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (/*has_missing_data*/ ctx[2]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(div2, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*level_breaks*/ 64) {
    				each_value = /*level_breaks*/ ctx[6];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div3, t6);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*has_missing_data*/ ctx[2]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(div3, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*interaction_tip*/ 16) set_data_dev(t8, /*interaction_tip*/ ctx[4]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks_1, detaching);
    			if (if_block0) if_block0.d();
    			destroy_each(each_blocks, detaching);
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("MapKey", slots, []);
    	let { hed = "" } = $$props;
    	let { subhed = "" } = $$props;
    	let { color_string = "" } = $$props;
    	let { level_breaks_string = "" } = $$props;
    	let { has_missing_data = false } = $$props;
    	let { missing_data_color = "#eee" } = $$props;
    	let { interaction_tip = "" } = $$props;
    	let colors = color_string.split(",");
    	let level_breaks = level_breaks_string.split(",");

    	const writable_props = [
    		"hed",
    		"subhed",
    		"color_string",
    		"level_breaks_string",
    		"has_missing_data",
    		"missing_data_color",
    		"interaction_tip"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MapKey> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("hed" in $$props) $$invalidate(0, hed = $$props.hed);
    		if ("subhed" in $$props) $$invalidate(1, subhed = $$props.subhed);
    		if ("color_string" in $$props) $$invalidate(7, color_string = $$props.color_string);
    		if ("level_breaks_string" in $$props) $$invalidate(8, level_breaks_string = $$props.level_breaks_string);
    		if ("has_missing_data" in $$props) $$invalidate(2, has_missing_data = $$props.has_missing_data);
    		if ("missing_data_color" in $$props) $$invalidate(3, missing_data_color = $$props.missing_data_color);
    		if ("interaction_tip" in $$props) $$invalidate(4, interaction_tip = $$props.interaction_tip);
    	};

    	$$self.$capture_state = () => ({
    		hed,
    		subhed,
    		color_string,
    		level_breaks_string,
    		has_missing_data,
    		missing_data_color,
    		interaction_tip,
    		colors,
    		level_breaks
    	});

    	$$self.$inject_state = $$props => {
    		if ("hed" in $$props) $$invalidate(0, hed = $$props.hed);
    		if ("subhed" in $$props) $$invalidate(1, subhed = $$props.subhed);
    		if ("color_string" in $$props) $$invalidate(7, color_string = $$props.color_string);
    		if ("level_breaks_string" in $$props) $$invalidate(8, level_breaks_string = $$props.level_breaks_string);
    		if ("has_missing_data" in $$props) $$invalidate(2, has_missing_data = $$props.has_missing_data);
    		if ("missing_data_color" in $$props) $$invalidate(3, missing_data_color = $$props.missing_data_color);
    		if ("interaction_tip" in $$props) $$invalidate(4, interaction_tip = $$props.interaction_tip);
    		if ("colors" in $$props) $$invalidate(5, colors = $$props.colors);
    		if ("level_breaks" in $$props) $$invalidate(6, level_breaks = $$props.level_breaks);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		hed,
    		subhed,
    		has_missing_data,
    		missing_data_color,
    		interaction_tip,
    		colors,
    		level_breaks,
    		color_string,
    		level_breaks_string
    	];
    }

    class MapKey extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			hed: 0,
    			subhed: 1,
    			color_string: 7,
    			level_breaks_string: 8,
    			has_missing_data: 2,
    			missing_data_color: 3,
    			interaction_tip: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MapKey",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get hed() {
    		throw new Error("<MapKey>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hed(value) {
    		throw new Error("<MapKey>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get subhed() {
    		throw new Error("<MapKey>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set subhed(value) {
    		throw new Error("<MapKey>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color_string() {
    		throw new Error("<MapKey>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color_string(value) {
    		throw new Error("<MapKey>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get level_breaks_string() {
    		throw new Error("<MapKey>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set level_breaks_string(value) {
    		throw new Error("<MapKey>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get has_missing_data() {
    		throw new Error("<MapKey>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set has_missing_data(value) {
    		throw new Error("<MapKey>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get missing_data_color() {
    		throw new Error("<MapKey>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set missing_data_color(value) {
    		throw new Error("<MapKey>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get interaction_tip() {
    		throw new Error("<MapKey>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set interaction_tip(value) {
    		throw new Error("<MapKey>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var epsilon = 1e-6;
    var pi = Math.PI;
    var tau = pi * 2;

    var degrees = 180 / pi;
    var radians = pi / 180;

    var abs = Math.abs;
    var cos = Math.cos;
    var sin = Math.sin;
    var sqrt$1 = Math.sqrt;

    function noop$1() {}

    function streamGeometry(geometry, stream) {
      if (geometry && streamGeometryType.hasOwnProperty(geometry.type)) {
        streamGeometryType[geometry.type](geometry, stream);
      }
    }

    var streamObjectType = {
      Feature: function(object, stream) {
        streamGeometry(object.geometry, stream);
      },
      FeatureCollection: function(object, stream) {
        var features = object.features, i = -1, n = features.length;
        while (++i < n) streamGeometry(features[i].geometry, stream);
      }
    };

    var streamGeometryType = {
      Sphere: function(object, stream) {
        stream.sphere();
      },
      Point: function(object, stream) {
        object = object.coordinates;
        stream.point(object[0], object[1], object[2]);
      },
      MultiPoint: function(object, stream) {
        var coordinates = object.coordinates, i = -1, n = coordinates.length;
        while (++i < n) object = coordinates[i], stream.point(object[0], object[1], object[2]);
      },
      LineString: function(object, stream) {
        streamLine(object.coordinates, stream, 0);
      },
      MultiLineString: function(object, stream) {
        var coordinates = object.coordinates, i = -1, n = coordinates.length;
        while (++i < n) streamLine(coordinates[i], stream, 0);
      },
      Polygon: function(object, stream) {
        streamPolygon(object.coordinates, stream);
      },
      MultiPolygon: function(object, stream) {
        var coordinates = object.coordinates, i = -1, n = coordinates.length;
        while (++i < n) streamPolygon(coordinates[i], stream);
      },
      GeometryCollection: function(object, stream) {
        var geometries = object.geometries, i = -1, n = geometries.length;
        while (++i < n) streamGeometry(geometries[i], stream);
      }
    };

    function streamLine(coordinates, stream, closed) {
      var i = -1, n = coordinates.length - closed, coordinate;
      stream.lineStart();
      while (++i < n) coordinate = coordinates[i], stream.point(coordinate[0], coordinate[1], coordinate[2]);
      stream.lineEnd();
    }

    function streamPolygon(coordinates, stream) {
      var i = -1, n = coordinates.length;
      stream.polygonStart();
      while (++i < n) streamLine(coordinates[i], stream, 1);
      stream.polygonEnd();
    }

    function geoStream(object, stream) {
      if (object && streamObjectType.hasOwnProperty(object.type)) {
        streamObjectType[object.type](object, stream);
      } else {
        streamGeometry(object, stream);
      }
    }

    function clipBuffer() {
      var lines = [],
          line;
      return {
        point: function(x, y, m) {
          line.push([x, y, m]);
        },
        lineStart: function() {
          lines.push(line = []);
        },
        lineEnd: noop$1,
        rejoin: function() {
          if (lines.length > 1) lines.push(lines.pop().concat(lines.shift()));
        },
        result: function() {
          var result = lines;
          lines = [];
          line = null;
          return result;
        }
      };
    }

    function pointEqual(a, b) {
      return abs(a[0] - b[0]) < epsilon && abs(a[1] - b[1]) < epsilon;
    }

    function Intersection(point, points, other, entry) {
      this.x = point;
      this.z = points;
      this.o = other; // another intersection
      this.e = entry; // is an entry?
      this.v = false; // visited
      this.n = this.p = null; // next & previous
    }

    // A generalized polygon clipping algorithm: given a polygon that has been cut
    // into its visible line segments, and rejoins the segments by interpolating
    // along the clip edge.
    function clipRejoin(segments, compareIntersection, startInside, interpolate, stream) {
      var subject = [],
          clip = [],
          i,
          n;

      segments.forEach(function(segment) {
        if ((n = segment.length - 1) <= 0) return;
        var n, p0 = segment[0], p1 = segment[n], x;

        if (pointEqual(p0, p1)) {
          if (!p0[2] && !p1[2]) {
            stream.lineStart();
            for (i = 0; i < n; ++i) stream.point((p0 = segment[i])[0], p0[1]);
            stream.lineEnd();
            return;
          }
          // handle degenerate cases by moving the point
          p1[0] += 2 * epsilon;
        }

        subject.push(x = new Intersection(p0, segment, null, true));
        clip.push(x.o = new Intersection(p0, null, x, false));
        subject.push(x = new Intersection(p1, segment, null, false));
        clip.push(x.o = new Intersection(p1, null, x, true));
      });

      if (!subject.length) return;

      clip.sort(compareIntersection);
      link(subject);
      link(clip);

      for (i = 0, n = clip.length; i < n; ++i) {
        clip[i].e = startInside = !startInside;
      }

      var start = subject[0],
          points,
          point;

      while (1) {
        // Find first unvisited intersection.
        var current = start,
            isSubject = true;
        while (current.v) if ((current = current.n) === start) return;
        points = current.z;
        stream.lineStart();
        do {
          current.v = current.o.v = true;
          if (current.e) {
            if (isSubject) {
              for (i = 0, n = points.length; i < n; ++i) stream.point((point = points[i])[0], point[1]);
            } else {
              interpolate(current.x, current.n.x, 1, stream);
            }
            current = current.n;
          } else {
            if (isSubject) {
              points = current.p.z;
              for (i = points.length - 1; i >= 0; --i) stream.point((point = points[i])[0], point[1]);
            } else {
              interpolate(current.x, current.p.x, -1, stream);
            }
            current = current.p;
          }
          current = current.o;
          points = current.z;
          isSubject = !isSubject;
        } while (!current.v);
        stream.lineEnd();
      }
    }

    function link(array) {
      if (!(n = array.length)) return;
      var n,
          i = 0,
          a = array[0],
          b;
      while (++i < n) {
        a.n = b = array[i];
        b.p = a;
        a = b;
      }
      a.n = b = array[0];
      b.p = a;
    }

    function clipLine(a, b, x0, y0, x1, y1) {
      var ax = a[0],
          ay = a[1],
          bx = b[0],
          by = b[1],
          t0 = 0,
          t1 = 1,
          dx = bx - ax,
          dy = by - ay,
          r;

      r = x0 - ax;
      if (!dx && r > 0) return;
      r /= dx;
      if (dx < 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      } else if (dx > 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      }

      r = x1 - ax;
      if (!dx && r < 0) return;
      r /= dx;
      if (dx < 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      } else if (dx > 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      }

      r = y0 - ay;
      if (!dy && r > 0) return;
      r /= dy;
      if (dy < 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      } else if (dy > 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      }

      r = y1 - ay;
      if (!dy && r < 0) return;
      r /= dy;
      if (dy < 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      } else if (dy > 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      }

      if (t0 > 0) a[0] = ax + t0 * dx, a[1] = ay + t0 * dy;
      if (t1 < 1) b[0] = ax + t1 * dx, b[1] = ay + t1 * dy;
      return true;
    }

    var clipMax = 1e9, clipMin = -clipMax;

    // TODO Use d3-polygon’s polygonContains here for the ring check?
    // TODO Eliminate duplicate buffering in clipBuffer and polygon.push?

    function clipRectangle(x0, y0, x1, y1) {

      function visible(x, y) {
        return x0 <= x && x <= x1 && y0 <= y && y <= y1;
      }

      function interpolate(from, to, direction, stream) {
        var a = 0, a1 = 0;
        if (from == null
            || (a = corner(from, direction)) !== (a1 = corner(to, direction))
            || comparePoint(from, to) < 0 ^ direction > 0) {
          do stream.point(a === 0 || a === 3 ? x0 : x1, a > 1 ? y1 : y0);
          while ((a = (a + direction + 4) % 4) !== a1);
        } else {
          stream.point(to[0], to[1]);
        }
      }

      function corner(p, direction) {
        return abs(p[0] - x0) < epsilon ? direction > 0 ? 0 : 3
            : abs(p[0] - x1) < epsilon ? direction > 0 ? 2 : 1
            : abs(p[1] - y0) < epsilon ? direction > 0 ? 1 : 0
            : direction > 0 ? 3 : 2; // abs(p[1] - y1) < epsilon
      }

      function compareIntersection(a, b) {
        return comparePoint(a.x, b.x);
      }

      function comparePoint(a, b) {
        var ca = corner(a, 1),
            cb = corner(b, 1);
        return ca !== cb ? ca - cb
            : ca === 0 ? b[1] - a[1]
            : ca === 1 ? a[0] - b[0]
            : ca === 2 ? a[1] - b[1]
            : b[0] - a[0];
      }

      return function(stream) {
        var activeStream = stream,
            bufferStream = clipBuffer(),
            segments,
            polygon,
            ring,
            x__, y__, v__, // first point
            x_, y_, v_, // previous point
            first,
            clean;

        var clipStream = {
          point: point,
          lineStart: lineStart,
          lineEnd: lineEnd,
          polygonStart: polygonStart,
          polygonEnd: polygonEnd
        };

        function point(x, y) {
          if (visible(x, y)) activeStream.point(x, y);
        }

        function polygonInside() {
          var winding = 0;

          for (var i = 0, n = polygon.length; i < n; ++i) {
            for (var ring = polygon[i], j = 1, m = ring.length, point = ring[0], a0, a1, b0 = point[0], b1 = point[1]; j < m; ++j) {
              a0 = b0, a1 = b1, point = ring[j], b0 = point[0], b1 = point[1];
              if (a1 <= y1) { if (b1 > y1 && (b0 - a0) * (y1 - a1) > (b1 - a1) * (x0 - a0)) ++winding; }
              else { if (b1 <= y1 && (b0 - a0) * (y1 - a1) < (b1 - a1) * (x0 - a0)) --winding; }
            }
          }

          return winding;
        }

        // Buffer geometry within a polygon and then clip it en masse.
        function polygonStart() {
          activeStream = bufferStream, segments = [], polygon = [], clean = true;
        }

        function polygonEnd() {
          var startInside = polygonInside(),
              cleanInside = clean && startInside,
              visible = (segments = merge(segments)).length;
          if (cleanInside || visible) {
            stream.polygonStart();
            if (cleanInside) {
              stream.lineStart();
              interpolate(null, null, 1, stream);
              stream.lineEnd();
            }
            if (visible) {
              clipRejoin(segments, compareIntersection, startInside, interpolate, stream);
            }
            stream.polygonEnd();
          }
          activeStream = stream, segments = polygon = ring = null;
        }

        function lineStart() {
          clipStream.point = linePoint;
          if (polygon) polygon.push(ring = []);
          first = true;
          v_ = false;
          x_ = y_ = NaN;
        }

        // TODO rather than special-case polygons, simply handle them separately.
        // Ideally, coincident intersection points should be jittered to avoid
        // clipping issues.
        function lineEnd() {
          if (segments) {
            linePoint(x__, y__);
            if (v__ && v_) bufferStream.rejoin();
            segments.push(bufferStream.result());
          }
          clipStream.point = point;
          if (v_) activeStream.lineEnd();
        }

        function linePoint(x, y) {
          var v = visible(x, y);
          if (polygon) ring.push([x, y]);
          if (first) {
            x__ = x, y__ = y, v__ = v;
            first = false;
            if (v) {
              activeStream.lineStart();
              activeStream.point(x, y);
            }
          } else {
            if (v && v_) activeStream.point(x, y);
            else {
              var a = [x_ = Math.max(clipMin, Math.min(clipMax, x_)), y_ = Math.max(clipMin, Math.min(clipMax, y_))],
                  b = [x = Math.max(clipMin, Math.min(clipMax, x)), y = Math.max(clipMin, Math.min(clipMax, y))];
              if (clipLine(a, b, x0, y0, x1, y1)) {
                if (!v_) {
                  activeStream.lineStart();
                  activeStream.point(a[0], a[1]);
                }
                activeStream.point(b[0], b[1]);
                if (!v) activeStream.lineEnd();
                clean = false;
              } else if (v) {
                activeStream.lineStart();
                activeStream.point(x, y);
                clean = false;
              }
            }
          }
          x_ = x, y_ = y, v_ = v;
        }

        return clipStream;
      };
    }

    var identity$3 = x => x;

    var areaSum = new Adder(),
        areaRingSum = new Adder(),
        x00,
        y00,
        x0,
        y0;

    var areaStream = {
      point: noop$1,
      lineStart: noop$1,
      lineEnd: noop$1,
      polygonStart: function() {
        areaStream.lineStart = areaRingStart;
        areaStream.lineEnd = areaRingEnd;
      },
      polygonEnd: function() {
        areaStream.lineStart = areaStream.lineEnd = areaStream.point = noop$1;
        areaSum.add(abs(areaRingSum));
        areaRingSum = new Adder();
      },
      result: function() {
        var area = areaSum / 2;
        areaSum = new Adder();
        return area;
      }
    };

    function areaRingStart() {
      areaStream.point = areaPointFirst;
    }

    function areaPointFirst(x, y) {
      areaStream.point = areaPoint;
      x00 = x0 = x, y00 = y0 = y;
    }

    function areaPoint(x, y) {
      areaRingSum.add(y0 * x - x0 * y);
      x0 = x, y0 = y;
    }

    function areaRingEnd() {
      areaPoint(x00, y00);
    }

    var x0$1 = Infinity,
        y0$1 = x0$1,
        x1 = -x0$1,
        y1 = x1;

    var boundsStream = {
      point: boundsPoint,
      lineStart: noop$1,
      lineEnd: noop$1,
      polygonStart: noop$1,
      polygonEnd: noop$1,
      result: function() {
        var bounds = [[x0$1, y0$1], [x1, y1]];
        x1 = y1 = -(y0$1 = x0$1 = Infinity);
        return bounds;
      }
    };

    function boundsPoint(x, y) {
      if (x < x0$1) x0$1 = x;
      if (x > x1) x1 = x;
      if (y < y0$1) y0$1 = y;
      if (y > y1) y1 = y;
    }

    // TODO Enforce positive area for exterior, negative area for interior?

    var X0 = 0,
        Y0 = 0,
        Z0 = 0,
        X1 = 0,
        Y1 = 0,
        Z1 = 0,
        X2 = 0,
        Y2 = 0,
        Z2 = 0,
        x00$1,
        y00$1,
        x0$2,
        y0$2;

    var centroidStream = {
      point: centroidPoint,
      lineStart: centroidLineStart,
      lineEnd: centroidLineEnd,
      polygonStart: function() {
        centroidStream.lineStart = centroidRingStart;
        centroidStream.lineEnd = centroidRingEnd;
      },
      polygonEnd: function() {
        centroidStream.point = centroidPoint;
        centroidStream.lineStart = centroidLineStart;
        centroidStream.lineEnd = centroidLineEnd;
      },
      result: function() {
        var centroid = Z2 ? [X2 / Z2, Y2 / Z2]
            : Z1 ? [X1 / Z1, Y1 / Z1]
            : Z0 ? [X0 / Z0, Y0 / Z0]
            : [NaN, NaN];
        X0 = Y0 = Z0 =
        X1 = Y1 = Z1 =
        X2 = Y2 = Z2 = 0;
        return centroid;
      }
    };

    function centroidPoint(x, y) {
      X0 += x;
      Y0 += y;
      ++Z0;
    }

    function centroidLineStart() {
      centroidStream.point = centroidPointFirstLine;
    }

    function centroidPointFirstLine(x, y) {
      centroidStream.point = centroidPointLine;
      centroidPoint(x0$2 = x, y0$2 = y);
    }

    function centroidPointLine(x, y) {
      var dx = x - x0$2, dy = y - y0$2, z = sqrt$1(dx * dx + dy * dy);
      X1 += z * (x0$2 + x) / 2;
      Y1 += z * (y0$2 + y) / 2;
      Z1 += z;
      centroidPoint(x0$2 = x, y0$2 = y);
    }

    function centroidLineEnd() {
      centroidStream.point = centroidPoint;
    }

    function centroidRingStart() {
      centroidStream.point = centroidPointFirstRing;
    }

    function centroidRingEnd() {
      centroidPointRing(x00$1, y00$1);
    }

    function centroidPointFirstRing(x, y) {
      centroidStream.point = centroidPointRing;
      centroidPoint(x00$1 = x0$2 = x, y00$1 = y0$2 = y);
    }

    function centroidPointRing(x, y) {
      var dx = x - x0$2,
          dy = y - y0$2,
          z = sqrt$1(dx * dx + dy * dy);

      X1 += z * (x0$2 + x) / 2;
      Y1 += z * (y0$2 + y) / 2;
      Z1 += z;

      z = y0$2 * x - x0$2 * y;
      X2 += z * (x0$2 + x);
      Y2 += z * (y0$2 + y);
      Z2 += z * 3;
      centroidPoint(x0$2 = x, y0$2 = y);
    }

    function PathContext(context) {
      this._context = context;
    }

    PathContext.prototype = {
      _radius: 4.5,
      pointRadius: function(_) {
        return this._radius = _, this;
      },
      polygonStart: function() {
        this._line = 0;
      },
      polygonEnd: function() {
        this._line = NaN;
      },
      lineStart: function() {
        this._point = 0;
      },
      lineEnd: function() {
        if (this._line === 0) this._context.closePath();
        this._point = NaN;
      },
      point: function(x, y) {
        switch (this._point) {
          case 0: {
            this._context.moveTo(x, y);
            this._point = 1;
            break;
          }
          case 1: {
            this._context.lineTo(x, y);
            break;
          }
          default: {
            this._context.moveTo(x + this._radius, y);
            this._context.arc(x, y, this._radius, 0, tau);
            break;
          }
        }
      },
      result: noop$1
    };

    var lengthSum = new Adder(),
        lengthRing,
        x00$2,
        y00$2,
        x0$3,
        y0$3;

    var lengthStream = {
      point: noop$1,
      lineStart: function() {
        lengthStream.point = lengthPointFirst;
      },
      lineEnd: function() {
        if (lengthRing) lengthPoint(x00$2, y00$2);
        lengthStream.point = noop$1;
      },
      polygonStart: function() {
        lengthRing = true;
      },
      polygonEnd: function() {
        lengthRing = null;
      },
      result: function() {
        var length = +lengthSum;
        lengthSum = new Adder();
        return length;
      }
    };

    function lengthPointFirst(x, y) {
      lengthStream.point = lengthPoint;
      x00$2 = x0$3 = x, y00$2 = y0$3 = y;
    }

    function lengthPoint(x, y) {
      x0$3 -= x, y0$3 -= y;
      lengthSum.add(sqrt$1(x0$3 * x0$3 + y0$3 * y0$3));
      x0$3 = x, y0$3 = y;
    }

    function PathString() {
      this._string = [];
    }

    PathString.prototype = {
      _radius: 4.5,
      _circle: circle(4.5),
      pointRadius: function(_) {
        if ((_ = +_) !== this._radius) this._radius = _, this._circle = null;
        return this;
      },
      polygonStart: function() {
        this._line = 0;
      },
      polygonEnd: function() {
        this._line = NaN;
      },
      lineStart: function() {
        this._point = 0;
      },
      lineEnd: function() {
        if (this._line === 0) this._string.push("Z");
        this._point = NaN;
      },
      point: function(x, y) {
        switch (this._point) {
          case 0: {
            this._string.push("M", x, ",", y);
            this._point = 1;
            break;
          }
          case 1: {
            this._string.push("L", x, ",", y);
            break;
          }
          default: {
            if (this._circle == null) this._circle = circle(this._radius);
            this._string.push("M", x, ",", y, this._circle);
            break;
          }
        }
      },
      result: function() {
        if (this._string.length) {
          var result = this._string.join("");
          this._string = [];
          return result;
        } else {
          return null;
        }
      }
    };

    function circle(radius) {
      return "m0," + radius
          + "a" + radius + "," + radius + " 0 1,1 0," + -2 * radius
          + "a" + radius + "," + radius + " 0 1,1 0," + 2 * radius
          + "z";
    }

    function geoPath(projection, context) {
      var pointRadius = 4.5,
          projectionStream,
          contextStream;

      function path(object) {
        if (object) {
          if (typeof pointRadius === "function") contextStream.pointRadius(+pointRadius.apply(this, arguments));
          geoStream(object, projectionStream(contextStream));
        }
        return contextStream.result();
      }

      path.area = function(object) {
        geoStream(object, projectionStream(areaStream));
        return areaStream.result();
      };

      path.measure = function(object) {
        geoStream(object, projectionStream(lengthStream));
        return lengthStream.result();
      };

      path.bounds = function(object) {
        geoStream(object, projectionStream(boundsStream));
        return boundsStream.result();
      };

      path.centroid = function(object) {
        geoStream(object, projectionStream(centroidStream));
        return centroidStream.result();
      };

      path.projection = function(_) {
        return arguments.length ? (projectionStream = _ == null ? (projection = null, identity$3) : (projection = _).stream, path) : projection;
      };

      path.context = function(_) {
        if (!arguments.length) return context;
        contextStream = _ == null ? (context = null, new PathString) : new PathContext(context = _);
        if (typeof pointRadius !== "function") contextStream.pointRadius(pointRadius);
        return path;
      };

      path.pointRadius = function(_) {
        if (!arguments.length) return pointRadius;
        pointRadius = typeof _ === "function" ? _ : (contextStream.pointRadius(+_), +_);
        return path;
      };

      return path.projection(projection).context(context);
    }

    function transformer$1(methods) {
      return function(stream) {
        var s = new TransformStream;
        for (var key in methods) s[key] = methods[key];
        s.stream = stream;
        return s;
      };
    }

    function TransformStream() {}

    TransformStream.prototype = {
      constructor: TransformStream,
      point: function(x, y) { this.stream.point(x, y); },
      sphere: function() { this.stream.sphere(); },
      lineStart: function() { this.stream.lineStart(); },
      lineEnd: function() { this.stream.lineEnd(); },
      polygonStart: function() { this.stream.polygonStart(); },
      polygonEnd: function() { this.stream.polygonEnd(); }
    };

    function fit(projection, fitBounds, object) {
      var clip = projection.clipExtent && projection.clipExtent();
      projection.scale(150).translate([0, 0]);
      if (clip != null) projection.clipExtent(null);
      geoStream(object, projection.stream(boundsStream));
      fitBounds(boundsStream.result());
      if (clip != null) projection.clipExtent(clip);
      return projection;
    }

    function fitExtent(projection, extent, object) {
      return fit(projection, function(b) {
        var w = extent[1][0] - extent[0][0],
            h = extent[1][1] - extent[0][1],
            k = Math.min(w / (b[1][0] - b[0][0]), h / (b[1][1] - b[0][1])),
            x = +extent[0][0] + (w - k * (b[1][0] + b[0][0])) / 2,
            y = +extent[0][1] + (h - k * (b[1][1] + b[0][1])) / 2;
        projection.scale(150 * k).translate([x, y]);
      }, object);
    }

    function fitSize(projection, size, object) {
      return fitExtent(projection, [[0, 0], size], object);
    }

    function fitWidth(projection, width, object) {
      return fit(projection, function(b) {
        var w = +width,
            k = w / (b[1][0] - b[0][0]),
            x = (w - k * (b[1][0] + b[0][0])) / 2,
            y = -k * b[0][1];
        projection.scale(150 * k).translate([x, y]);
      }, object);
    }

    function fitHeight(projection, height, object) {
      return fit(projection, function(b) {
        var h = +height,
            k = h / (b[1][1] - b[0][1]),
            x = -k * b[0][0],
            y = (h - k * (b[1][1] + b[0][1])) / 2;
        projection.scale(150 * k).translate([x, y]);
      }, object);
    }

    function geoIdentity() {
      var k = 1, tx = 0, ty = 0, sx = 1, sy = 1, // scale, translate and reflect
          alpha = 0, ca, sa, // angle
          x0 = null, y0, x1, y1, // clip extent
          kx = 1, ky = 1,
          transform = transformer$1({
            point: function(x, y) {
              var p = projection([x, y]);
              this.stream.point(p[0], p[1]);
            }
          }),
          postclip = identity$3,
          cache,
          cacheStream;

      function reset() {
        kx = k * sx;
        ky = k * sy;
        cache = cacheStream = null;
        return projection;
      }

      function projection (p) {
        var x = p[0] * kx, y = p[1] * ky;
        if (alpha) {
          var t = y * ca - x * sa;
          x = x * ca + y * sa;
          y = t;
        }    
        return [x + tx, y + ty];
      }
      projection.invert = function(p) {
        var x = p[0] - tx, y = p[1] - ty;
        if (alpha) {
          var t = y * ca + x * sa;
          x = x * ca - y * sa;
          y = t;
        }
        return [x / kx, y / ky];
      };
      projection.stream = function(stream) {
        return cache && cacheStream === stream ? cache : cache = transform(postclip(cacheStream = stream));
      };
      projection.postclip = function(_) {
        return arguments.length ? (postclip = _, x0 = y0 = x1 = y1 = null, reset()) : postclip;
      };
      projection.clipExtent = function(_) {
        return arguments.length ? (postclip = _ == null ? (x0 = y0 = x1 = y1 = null, identity$3) : clipRectangle(x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1]), reset()) : x0 == null ? null : [[x0, y0], [x1, y1]];
      };
      projection.scale = function(_) {
        return arguments.length ? (k = +_, reset()) : k;
      };
      projection.translate = function(_) {
        return arguments.length ? (tx = +_[0], ty = +_[1], reset()) : [tx, ty];
      };
      projection.angle = function(_) {
        return arguments.length ? (alpha = _ % 360 * radians, sa = sin(alpha), ca = cos(alpha), reset()) : alpha * degrees;
      };
      projection.reflectX = function(_) {
        return arguments.length ? (sx = _ ? -1 : 1, reset()) : sx < 0;
      };
      projection.reflectY = function(_) {
        return arguments.length ? (sy = _ ? -1 : 1, reset()) : sy < 0;
      };
      projection.fitExtent = function(extent, object) {
        return fitExtent(projection, extent, object);
      };
      projection.fitSize = function(size, object) {
        return fitSize(projection, size, object);
      };
      projection.fitWidth = function(width, object) {
        return fitWidth(projection, width, object);
      };
      projection.fitHeight = function(height, object) {
        return fitHeight(projection, height, object);
      };

      return projection;
    }

    function identity$4(x) {
      return x;
    }

    function transform(transform) {
      if (transform == null) return identity$4;
      var x0,
          y0,
          kx = transform.scale[0],
          ky = transform.scale[1],
          dx = transform.translate[0],
          dy = transform.translate[1];
      return function(input, i) {
        if (!i) x0 = y0 = 0;
        var j = 2, n = input.length, output = new Array(n);
        output[0] = (x0 += input[0]) * kx + dx;
        output[1] = (y0 += input[1]) * ky + dy;
        while (j < n) output[j] = input[j], ++j;
        return output;
      };
    }

    function reverse(array, n) {
      var t, j = array.length, i = j - n;
      while (i < --j) t = array[i], array[i++] = array[j], array[j] = t;
    }

    function feature(topology, o) {
      if (typeof o === "string") o = topology.objects[o];
      return o.type === "GeometryCollection"
          ? {type: "FeatureCollection", features: o.geometries.map(function(o) { return feature$1(topology, o); })}
          : feature$1(topology, o);
    }

    function feature$1(topology, o) {
      var id = o.id,
          bbox = o.bbox,
          properties = o.properties == null ? {} : o.properties,
          geometry = object$1(topology, o);
      return id == null && bbox == null ? {type: "Feature", properties: properties, geometry: geometry}
          : bbox == null ? {type: "Feature", id: id, properties: properties, geometry: geometry}
          : {type: "Feature", id: id, bbox: bbox, properties: properties, geometry: geometry};
    }

    function object$1(topology, o) {
      var transformPoint = transform(topology.transform),
          arcs = topology.arcs;

      function arc(i, points) {
        if (points.length) points.pop();
        for (var a = arcs[i < 0 ? ~i : i], k = 0, n = a.length; k < n; ++k) {
          points.push(transformPoint(a[k], k));
        }
        if (i < 0) reverse(points, n);
      }

      function point(p) {
        return transformPoint(p);
      }

      function line(arcs) {
        var points = [];
        for (var i = 0, n = arcs.length; i < n; ++i) arc(arcs[i], points);
        if (points.length < 2) points.push(points[0]); // This should never happen per the specification.
        return points;
      }

      function ring(arcs) {
        var points = line(arcs);
        while (points.length < 4) points.push(points[0]); // This may happen if an arc has only two points.
        return points;
      }

      function polygon(arcs) {
        return arcs.map(ring);
      }

      function geometry(o) {
        var type = o.type, coordinates;
        switch (type) {
          case "GeometryCollection": return {type: type, geometries: o.geometries.map(geometry)};
          case "Point": coordinates = point(o.coordinates); break;
          case "MultiPoint": coordinates = o.coordinates.map(point); break;
          case "LineString": coordinates = line(o.arcs); break;
          case "MultiLineString": coordinates = o.arcs.map(line); break;
          case "Polygon": coordinates = polygon(o.arcs); break;
          case "MultiPolygon": coordinates = o.arcs.map(polygon); break;
          default: return null;
        }
        return {type: type, coordinates: coordinates};
      }

      return geometry(o);
    }

    /* src/components/smarts/Map.albers.svelte generated by Svelte v3.32.2 */

    const { console: console_1$1 } = globals;
    const file$4 = "src/components/smarts/Map.albers.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	return child_ctx;
    }

    // (79:1) {#each features as feature}
    function create_each_block$1(ctx) {
    	let path;
    	let path_fill_value;
    	let path_stroke_value;
    	let path_stroke_width_value;
    	let path_d_value;
    	let mounted;
    	let dispose;

    	function mouseover_handler(...args) {
    		return /*mouseover_handler*/ ctx[17](/*feature*/ ctx[22], ...args);
    	}

    	const block = {
    		c: function create() {
    			path = svg_element("path");
    			attr_dev(path, "class", "feature-path svelte-za6u4e");
    			attr_dev(path, "fill", path_fill_value = /*fill*/ ctx[0] || /*feature*/ ctx[22].properties.fill || "None" || /*$zGet*/ ctx[5](/*feature*/ ctx[22].properties));
    			attr_dev(path, "stroke", path_stroke_value = /*stroke*/ ctx[1] || /*feature*/ ctx[22].properties.stroke);
    			attr_dev(path, "stroke-width", path_stroke_width_value = /*strokeWidth*/ ctx[2] || /*feature*/ ctx[22].properties["stroke-width"]);
    			attr_dev(path, "d", path_d_value = /*geoPathFn*/ ctx[4](/*feature*/ ctx[22]));
    			add_location(path, file$4, 79, 2, 2431);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, path, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(path, "mouseover", mouseover_handler, false, false, false),
    					listen_dev(
    						path,
    						"mousemove",
    						function () {
    							if (is_function(/*handleMousemove*/ ctx[11](/*feature*/ ctx[22]))) /*handleMousemove*/ ctx[11](/*feature*/ ctx[22]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*fill, features, $zGet*/ 41 && path_fill_value !== (path_fill_value = /*fill*/ ctx[0] || /*feature*/ ctx[22].properties.fill || "None" || /*$zGet*/ ctx[5](/*feature*/ ctx[22].properties))) {
    				attr_dev(path, "fill", path_fill_value);
    			}

    			if (dirty & /*stroke, features*/ 10 && path_stroke_value !== (path_stroke_value = /*stroke*/ ctx[1] || /*feature*/ ctx[22].properties.stroke)) {
    				attr_dev(path, "stroke", path_stroke_value);
    			}

    			if (dirty & /*strokeWidth, features*/ 12 && path_stroke_width_value !== (path_stroke_width_value = /*strokeWidth*/ ctx[2] || /*feature*/ ctx[22].properties["stroke-width"])) {
    				attr_dev(path, "stroke-width", path_stroke_width_value);
    			}

    			if (dirty & /*geoPathFn, features*/ 24 && path_d_value !== (path_d_value = /*geoPathFn*/ ctx[4](/*feature*/ ctx[22]))) {
    				attr_dev(path, "d", path_d_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(path);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(79:1) {#each features as feature}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let g;
    	let mounted;
    	let dispose;
    	let each_value = /*features*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			g = svg_element("g");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(g, "class", "map-group");
    			add_location(g, file$4, 74, 0, 2333);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g, null);
    			}

    			if (!mounted) {
    				dispose = listen_dev(g, "mouseout", /*mouseout_handler*/ ctx[18], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*fill, features, $zGet, stroke, strokeWidth, geoPathFn, dispatch, handleMousemove*/ 3135) {
    				each_value = /*features*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(g, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let projectionFn;
    	let geoPathFn;
    	let $data;
    	let $width;
    	let $height;
    	let $zGet;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Map_albers", slots, []);
    	const { data, width, height, zGet } = getContext("LayerCake");
    	validate_store(data, "data");
    	component_subscribe($$self, data, value => $$invalidate(19, $data = value));
    	validate_store(width, "width");
    	component_subscribe($$self, width, value => $$invalidate(15, $width = value));
    	validate_store(height, "height");
    	component_subscribe($$self, height, value => $$invalidate(16, $height = value));
    	validate_store(zGet, "zGet");
    	component_subscribe($$self, zGet, value => $$invalidate(5, $zGet = value));
    	let { fill = undefined } = $$props;
    	let { stroke = undefined } = $$props;
    	let { strokeWidth = undefined } = $$props;
    	let { collection_name = undefined } = $$props;
    	let { base_collection_name = collection_name } = $$props;
    	console.log("using collection:", collection_name);
    	let collection = feature($data, $data.objects[collection_name]);
    	let base_collection = feature($data, $data.objects[base_collection_name]);
    	let { features = collection.features } = $$props;

    	/* --------------------------------------------
     * Here's how you would do cross-component hovers
     */
    	const dispatch = createEventDispatcher();

    	function handleMousemove(feature) {
    		return function handleMousemoveFn(e) {
    			raise(this);

    			// When the element gets raised, it flashes 0,0 for a second so skip that
    			if (e.layerX !== 0 && e.layerY !== 0) {
    				dispatch("mousemove", { e, props: feature.properties });
    			}
    		};
    	}

    	const writable_props = [
    		"fill",
    		"stroke",
    		"strokeWidth",
    		"collection_name",
    		"base_collection_name",
    		"features"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Map_albers> was created with unknown prop '${key}'`);
    	});

    	const mouseover_handler = (feature, e) => dispatch("mousemove", { e, props: feature.properties });
    	const mouseout_handler = e => dispatch("mouseout");

    	$$self.$$set = $$props => {
    		if ("fill" in $$props) $$invalidate(0, fill = $$props.fill);
    		if ("stroke" in $$props) $$invalidate(1, stroke = $$props.stroke);
    		if ("strokeWidth" in $$props) $$invalidate(2, strokeWidth = $$props.strokeWidth);
    		if ("collection_name" in $$props) $$invalidate(12, collection_name = $$props.collection_name);
    		if ("base_collection_name" in $$props) $$invalidate(13, base_collection_name = $$props.base_collection_name);
    		if ("features" in $$props) $$invalidate(3, features = $$props.features);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		createEventDispatcher,
    		geoPath,
    		geoIdentity,
    		raise,
    		feature,
    		data,
    		width,
    		height,
    		zGet,
    		fill,
    		stroke,
    		strokeWidth,
    		collection_name,
    		base_collection_name,
    		collection,
    		base_collection,
    		features,
    		dispatch,
    		handleMousemove,
    		$data,
    		projectionFn,
    		$width,
    		$height,
    		geoPathFn,
    		$zGet
    	});

    	$$self.$inject_state = $$props => {
    		if ("fill" in $$props) $$invalidate(0, fill = $$props.fill);
    		if ("stroke" in $$props) $$invalidate(1, stroke = $$props.stroke);
    		if ("strokeWidth" in $$props) $$invalidate(2, strokeWidth = $$props.strokeWidth);
    		if ("collection_name" in $$props) $$invalidate(12, collection_name = $$props.collection_name);
    		if ("base_collection_name" in $$props) $$invalidate(13, base_collection_name = $$props.base_collection_name);
    		if ("collection" in $$props) collection = $$props.collection;
    		if ("base_collection" in $$props) $$invalidate(21, base_collection = $$props.base_collection);
    		if ("features" in $$props) $$invalidate(3, features = $$props.features);
    		if ("projectionFn" in $$props) $$invalidate(14, projectionFn = $$props.projectionFn);
    		if ("geoPathFn" in $$props) $$invalidate(4, geoPathFn = $$props.geoPathFn);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$width, $height*/ 98304) {
    			/* --------------------------------------------
    * Apply "null" projection 
    */
    			$$invalidate(14, projectionFn = geoIdentity().reflectY(true).fitSize([$width, $height], base_collection));
    		}

    		if ($$self.$$.dirty & /*projectionFn*/ 16384) {
    			$$invalidate(4, geoPathFn = geoPath(projectionFn));
    		}

    		if ($$self.$$.dirty & /*projectionFn*/ 16384) {
    			$$invalidate(4, geoPathFn = geoPath(projectionFn));
    		}
    	};

    	return [
    		fill,
    		stroke,
    		strokeWidth,
    		features,
    		geoPathFn,
    		$zGet,
    		data,
    		width,
    		height,
    		zGet,
    		dispatch,
    		handleMousemove,
    		collection_name,
    		base_collection_name,
    		projectionFn,
    		$width,
    		$height,
    		mouseover_handler,
    		mouseout_handler
    	];
    }

    class Map_albers extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			fill: 0,
    			stroke: 1,
    			strokeWidth: 2,
    			collection_name: 12,
    			base_collection_name: 13,
    			features: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Map_albers",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get fill() {
    		throw new Error("<Map_albers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fill(value) {
    		throw new Error("<Map_albers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get stroke() {
    		throw new Error("<Map_albers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set stroke(value) {
    		throw new Error("<Map_albers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get strokeWidth() {
    		throw new Error("<Map_albers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set strokeWidth(value) {
    		throw new Error("<Map_albers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get collection_name() {
    		throw new Error("<Map_albers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set collection_name(value) {
    		throw new Error("<Map_albers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get base_collection_name() {
    		throw new Error("<Map_albers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set base_collection_name(value) {
    		throw new Error("<Map_albers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get features() {
    		throw new Error("<Map_albers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set features(value) {
    		throw new Error("<Map_albers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/smarts/MapLabels.albers.svelte generated by Svelte v3.32.2 */

    const { console: console_1$2 } = globals;
    const file$5 = "src/components/smarts/MapLabels.albers.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	return child_ctx;
    }

    // (76:8) {#if (feature.geometry)}
    function create_if_block$2(ctx) {
    	let text_1;
    	let t_value = /*feature*/ ctx[18].properties[/*label_property*/ ctx[1]] + "";
    	let t;
    	let text_1_class_value;
    	let text_1_id_value;
    	let text_1_x_value;
    	let text_1_y_value;

    	const block = {
    		c: function create() {
    			text_1 = svg_element("text");
    			t = text(t_value);
    			attr_dev(text_1, "class", text_1_class_value = "label-text label-text-" + /*collection_name*/ ctx[0] + " svelte-1x2ptmk");
    			attr_dev(text_1, "id", text_1_id_value = /*feature*/ ctx[18].id || null);
    			attr_dev(text_1, "x", text_1_x_value = /*projectionFn*/ ctx[6](/*feature*/ ctx[18].geometry.coordinates)[0]);
    			attr_dev(text_1, "y", text_1_y_value = /*projectionFn*/ ctx[6](/*feature*/ ctx[18].geometry.coordinates)[1]);
    			add_location(text_1, file$5, 77, 12, 2479);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, text_1, anchor);
    			append_dev(text_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*features, label_property*/ 34 && t_value !== (t_value = /*feature*/ ctx[18].properties[/*label_property*/ ctx[1]] + "")) set_data_dev(t, t_value);

    			if (dirty & /*collection_name*/ 1 && text_1_class_value !== (text_1_class_value = "label-text label-text-" + /*collection_name*/ ctx[0] + " svelte-1x2ptmk")) {
    				attr_dev(text_1, "class", text_1_class_value);
    			}

    			if (dirty & /*features*/ 32 && text_1_id_value !== (text_1_id_value = /*feature*/ ctx[18].id || null)) {
    				attr_dev(text_1, "id", text_1_id_value);
    			}

    			if (dirty & /*projectionFn, features*/ 96 && text_1_x_value !== (text_1_x_value = /*projectionFn*/ ctx[6](/*feature*/ ctx[18].geometry.coordinates)[0])) {
    				attr_dev(text_1, "x", text_1_x_value);
    			}

    			if (dirty & /*projectionFn, features*/ 96 && text_1_y_value !== (text_1_y_value = /*projectionFn*/ ctx[6](/*feature*/ ctx[18].geometry.coordinates)[1])) {
    				attr_dev(text_1, "y", text_1_y_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(text_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(76:8) {#if (feature.geometry)}",
    		ctx
    	});

    	return block;
    }

    // (66:1) {#each features as feature}
    function create_each_block$2(ctx) {
    	let path;
    	let path_fill_value;
    	let path_stroke_value;
    	let path_stroke_width_value;
    	let path_d_value;
    	let if_block_anchor;
    	let if_block = /*feature*/ ctx[18].geometry && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			path = svg_element("path");
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(path, "class", "feature-path");
    			attr_dev(path, "fill", path_fill_value = /*fill*/ ctx[2] || /*feature*/ ctx[18].properties.fill || "None");
    			attr_dev(path, "stroke", path_stroke_value = /*stroke*/ ctx[3] || /*feature*/ ctx[18].properties.stroke);
    			attr_dev(path, "stroke-width", path_stroke_width_value = /*strokeWidth*/ ctx[4] || /*feature*/ ctx[18].properties["stroke-width"]);
    			attr_dev(path, "d", path_d_value = /*geoPathFn*/ ctx[7](/*feature*/ ctx[18]));
    			add_location(path, file$5, 67, 2, 2103);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, path, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*fill, features*/ 36 && path_fill_value !== (path_fill_value = /*fill*/ ctx[2] || /*feature*/ ctx[18].properties.fill || "None")) {
    				attr_dev(path, "fill", path_fill_value);
    			}

    			if (dirty & /*stroke, features*/ 40 && path_stroke_value !== (path_stroke_value = /*stroke*/ ctx[3] || /*feature*/ ctx[18].properties.stroke)) {
    				attr_dev(path, "stroke", path_stroke_value);
    			}

    			if (dirty & /*strokeWidth, features*/ 48 && path_stroke_width_value !== (path_stroke_width_value = /*strokeWidth*/ ctx[4] || /*feature*/ ctx[18].properties["stroke-width"])) {
    				attr_dev(path, "stroke-width", path_stroke_width_value);
    			}

    			if (dirty & /*geoPathFn, features*/ 160 && path_d_value !== (path_d_value = /*geoPathFn*/ ctx[7](/*feature*/ ctx[18]))) {
    				attr_dev(path, "d", path_d_value);
    			}

    			if (/*feature*/ ctx[18].geometry) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(path);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(66:1) {#each features as feature}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let g;
    	let each_value = /*features*/ ctx[5];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			g = svg_element("g");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(g, "class", "map-group");
    			add_location(g, file$5, 61, 0, 1996);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*collection_name, features, projectionFn, label_property, fill, stroke, strokeWidth, geoPathFn*/ 255) {
    				each_value = /*features*/ ctx[5];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(g, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let projectionFn;
    	let geoPathFn;
    	let $data;
    	let $width;
    	let $height;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("MapLabels_albers", slots, []);
    	const { data, width, height, zGet } = getContext("LayerCake");
    	validate_store(data, "data");
    	component_subscribe($$self, data, value => $$invalidate(14, $data = value));
    	validate_store(width, "width");
    	component_subscribe($$self, width, value => $$invalidate(12, $width = value));
    	validate_store(height, "height");
    	component_subscribe($$self, height, value => $$invalidate(13, $height = value));
    	let { collection_name = undefined } = $$props;
    	let { base_collection_name = collection_name } = $$props;
    	let { label_property = "label-text" } = $$props;
    	console.log("using collection:", collection_name);
    	let collection = feature($data, $data.objects[collection_name]);
    	let base_collection = feature($data, $data.objects[base_collection_name]);
    	let { fill = "None" } = $$props; // The fill will be determined by the scale, unless this prop is set
    	let { stroke = "None" } = $$props;
    	let { strokeWidth = "None" } = $$props;
    	let { features = collection.features } = $$props;
    	console.log(features);

    	const writable_props = [
    		"collection_name",
    		"base_collection_name",
    		"label_property",
    		"fill",
    		"stroke",
    		"strokeWidth",
    		"features"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<MapLabels_albers> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("collection_name" in $$props) $$invalidate(0, collection_name = $$props.collection_name);
    		if ("base_collection_name" in $$props) $$invalidate(11, base_collection_name = $$props.base_collection_name);
    		if ("label_property" in $$props) $$invalidate(1, label_property = $$props.label_property);
    		if ("fill" in $$props) $$invalidate(2, fill = $$props.fill);
    		if ("stroke" in $$props) $$invalidate(3, stroke = $$props.stroke);
    		if ("strokeWidth" in $$props) $$invalidate(4, strokeWidth = $$props.strokeWidth);
    		if ("features" in $$props) $$invalidate(5, features = $$props.features);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		createEventDispatcher,
    		geoPath,
    		geoIdentity,
    		raise,
    		feature,
    		data,
    		width,
    		height,
    		zGet,
    		collection_name,
    		base_collection_name,
    		label_property,
    		collection,
    		base_collection,
    		fill,
    		stroke,
    		strokeWidth,
    		features,
    		$data,
    		projectionFn,
    		$width,
    		$height,
    		geoPathFn
    	});

    	$$self.$inject_state = $$props => {
    		if ("collection_name" in $$props) $$invalidate(0, collection_name = $$props.collection_name);
    		if ("base_collection_name" in $$props) $$invalidate(11, base_collection_name = $$props.base_collection_name);
    		if ("label_property" in $$props) $$invalidate(1, label_property = $$props.label_property);
    		if ("collection" in $$props) collection = $$props.collection;
    		if ("base_collection" in $$props) $$invalidate(17, base_collection = $$props.base_collection);
    		if ("fill" in $$props) $$invalidate(2, fill = $$props.fill);
    		if ("stroke" in $$props) $$invalidate(3, stroke = $$props.stroke);
    		if ("strokeWidth" in $$props) $$invalidate(4, strokeWidth = $$props.strokeWidth);
    		if ("features" in $$props) $$invalidate(5, features = $$props.features);
    		if ("projectionFn" in $$props) $$invalidate(6, projectionFn = $$props.projectionFn);
    		if ("geoPathFn" in $$props) $$invalidate(7, geoPathFn = $$props.geoPathFn);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$width, $height*/ 12288) {
    			/* --------------------------------------------
     * Apply "null" projection 
     */
    			$$invalidate(6, projectionFn = geoIdentity().reflectY(true).fitSize([$width, $height], base_collection));
    		}

    		if ($$self.$$.dirty & /*projectionFn*/ 64) {
    			$$invalidate(7, geoPathFn = geoPath(projectionFn));
    		}
    	};

    	return [
    		collection_name,
    		label_property,
    		fill,
    		stroke,
    		strokeWidth,
    		features,
    		projectionFn,
    		geoPathFn,
    		data,
    		width,
    		height,
    		base_collection_name,
    		$width,
    		$height
    	];
    }

    class MapLabels_albers extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			collection_name: 0,
    			base_collection_name: 11,
    			label_property: 1,
    			fill: 2,
    			stroke: 3,
    			strokeWidth: 4,
    			features: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MapLabels_albers",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get collection_name() {
    		throw new Error("<MapLabels_albers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set collection_name(value) {
    		throw new Error("<MapLabels_albers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get base_collection_name() {
    		throw new Error("<MapLabels_albers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set base_collection_name(value) {
    		throw new Error("<MapLabels_albers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label_property() {
    		throw new Error("<MapLabels_albers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label_property(value) {
    		throw new Error("<MapLabels_albers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fill() {
    		throw new Error("<MapLabels_albers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fill(value) {
    		throw new Error("<MapLabels_albers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get stroke() {
    		throw new Error("<MapLabels_albers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set stroke(value) {
    		throw new Error("<MapLabels_albers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get strokeWidth() {
    		throw new Error("<MapLabels_albers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set strokeWidth(value) {
    		throw new Error("<MapLabels_albers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get features() {
    		throw new Error("<MapLabels_albers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set features(value) {
    		throw new Error("<MapLabels_albers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var dayjs_min = createCommonjsModule(function (module, exports) {
    !function(t,e){module.exports=e();}(commonjsGlobal,function(){var t="millisecond",e="second",n="minute",r="hour",i="day",s="week",u="month",a="quarter",o="year",f="date",h=/^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[^0-9]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/,c=/\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,d={name:"en",weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_")},$=function(t,e,n){var r=String(t);return !r||r.length>=e?t:""+Array(e+1-r.length).join(n)+t},l={s:$,z:function(t){var e=-t.utcOffset(),n=Math.abs(e),r=Math.floor(n/60),i=n%60;return (e<=0?"+":"-")+$(r,2,"0")+":"+$(i,2,"0")},m:function t(e,n){if(e.date()<n.date())return -t(n,e);var r=12*(n.year()-e.year())+(n.month()-e.month()),i=e.clone().add(r,u),s=n-i<0,a=e.clone().add(r+(s?-1:1),u);return +(-(r+(n-i)/(s?i-a:a-i))||0)},a:function(t){return t<0?Math.ceil(t)||0:Math.floor(t)},p:function(h){return {M:u,y:o,w:s,d:i,D:f,h:r,m:n,s:e,ms:t,Q:a}[h]||String(h||"").toLowerCase().replace(/s$/,"")},u:function(t){return void 0===t}},y="en",M={};M[y]=d;var m=function(t){return t instanceof S},D=function(t,e,n){var r;if(!t)return y;if("string"==typeof t)M[t]&&(r=t),e&&(M[t]=e,r=t);else {var i=t.name;M[i]=t,r=i;}return !n&&r&&(y=r),r||!n&&y},v=function(t,e){if(m(t))return t.clone();var n="object"==typeof e?e:{};return n.date=t,n.args=arguments,new S(n)},g=l;g.l=D,g.i=m,g.w=function(t,e){return v(t,{locale:e.$L,utc:e.$u,x:e.$x,$offset:e.$offset})};var S=function(){function d(t){this.$L=D(t.locale,null,!0),this.parse(t);}var $=d.prototype;return $.parse=function(t){this.$d=function(t){var e=t.date,n=t.utc;if(null===e)return new Date(NaN);if(g.u(e))return new Date;if(e instanceof Date)return new Date(e);if("string"==typeof e&&!/Z$/i.test(e)){var r=e.match(h);if(r){var i=r[2]-1||0,s=(r[7]||"0").substring(0,3);return n?new Date(Date.UTC(r[1],i,r[3]||1,r[4]||0,r[5]||0,r[6]||0,s)):new Date(r[1],i,r[3]||1,r[4]||0,r[5]||0,r[6]||0,s)}}return new Date(e)}(t),this.$x=t.x||{},this.init();},$.init=function(){var t=this.$d;this.$y=t.getFullYear(),this.$M=t.getMonth(),this.$D=t.getDate(),this.$W=t.getDay(),this.$H=t.getHours(),this.$m=t.getMinutes(),this.$s=t.getSeconds(),this.$ms=t.getMilliseconds();},$.$utils=function(){return g},$.isValid=function(){return !("Invalid Date"===this.$d.toString())},$.isSame=function(t,e){var n=v(t);return this.startOf(e)<=n&&n<=this.endOf(e)},$.isAfter=function(t,e){return v(t)<this.startOf(e)},$.isBefore=function(t,e){return this.endOf(e)<v(t)},$.$g=function(t,e,n){return g.u(t)?this[e]:this.set(n,t)},$.unix=function(){return Math.floor(this.valueOf()/1e3)},$.valueOf=function(){return this.$d.getTime()},$.startOf=function(t,a){var h=this,c=!!g.u(a)||a,d=g.p(t),$=function(t,e){var n=g.w(h.$u?Date.UTC(h.$y,e,t):new Date(h.$y,e,t),h);return c?n:n.endOf(i)},l=function(t,e){return g.w(h.toDate()[t].apply(h.toDate("s"),(c?[0,0,0,0]:[23,59,59,999]).slice(e)),h)},y=this.$W,M=this.$M,m=this.$D,D="set"+(this.$u?"UTC":"");switch(d){case o:return c?$(1,0):$(31,11);case u:return c?$(1,M):$(0,M+1);case s:var v=this.$locale().weekStart||0,S=(y<v?y+7:y)-v;return $(c?m-S:m+(6-S),M);case i:case f:return l(D+"Hours",0);case r:return l(D+"Minutes",1);case n:return l(D+"Seconds",2);case e:return l(D+"Milliseconds",3);default:return this.clone()}},$.endOf=function(t){return this.startOf(t,!1)},$.$set=function(s,a){var h,c=g.p(s),d="set"+(this.$u?"UTC":""),$=(h={},h[i]=d+"Date",h[f]=d+"Date",h[u]=d+"Month",h[o]=d+"FullYear",h[r]=d+"Hours",h[n]=d+"Minutes",h[e]=d+"Seconds",h[t]=d+"Milliseconds",h)[c],l=c===i?this.$D+(a-this.$W):a;if(c===u||c===o){var y=this.clone().set(f,1);y.$d[$](l),y.init(),this.$d=y.set(f,Math.min(this.$D,y.daysInMonth())).$d;}else $&&this.$d[$](l);return this.init(),this},$.set=function(t,e){return this.clone().$set(t,e)},$.get=function(t){return this[g.p(t)]()},$.add=function(t,a){var f,h=this;t=Number(t);var c=g.p(a),d=function(e){var n=v(h);return g.w(n.date(n.date()+Math.round(e*t)),h)};if(c===u)return this.set(u,this.$M+t);if(c===o)return this.set(o,this.$y+t);if(c===i)return d(1);if(c===s)return d(7);var $=(f={},f[n]=6e4,f[r]=36e5,f[e]=1e3,f)[c]||1,l=this.$d.getTime()+t*$;return g.w(l,this)},$.subtract=function(t,e){return this.add(-1*t,e)},$.format=function(t){var e=this;if(!this.isValid())return "Invalid Date";var n=t||"YYYY-MM-DDTHH:mm:ssZ",r=g.z(this),i=this.$locale(),s=this.$H,u=this.$m,a=this.$M,o=i.weekdays,f=i.months,h=function(t,r,i,s){return t&&(t[r]||t(e,n))||i[r].substr(0,s)},d=function(t){return g.s(s%12||12,t,"0")},$=i.meridiem||function(t,e,n){var r=t<12?"AM":"PM";return n?r.toLowerCase():r},l={YY:String(this.$y).slice(-2),YYYY:this.$y,M:a+1,MM:g.s(a+1,2,"0"),MMM:h(i.monthsShort,a,f,3),MMMM:h(f,a),D:this.$D,DD:g.s(this.$D,2,"0"),d:String(this.$W),dd:h(i.weekdaysMin,this.$W,o,2),ddd:h(i.weekdaysShort,this.$W,o,3),dddd:o[this.$W],H:String(s),HH:g.s(s,2,"0"),h:d(1),hh:d(2),a:$(s,u,!0),A:$(s,u,!1),m:String(u),mm:g.s(u,2,"0"),s:String(this.$s),ss:g.s(this.$s,2,"0"),SSS:g.s(this.$ms,3,"0"),Z:r};return n.replace(c,function(t,e){return e||l[t]||r.replace(":","")})},$.utcOffset=function(){return 15*-Math.round(this.$d.getTimezoneOffset()/15)},$.diff=function(t,f,h){var c,d=g.p(f),$=v(t),l=6e4*($.utcOffset()-this.utcOffset()),y=this-$,M=g.m(this,$);return M=(c={},c[o]=M/12,c[u]=M,c[a]=M/3,c[s]=(y-l)/6048e5,c[i]=(y-l)/864e5,c[r]=y/36e5,c[n]=y/6e4,c[e]=y/1e3,c)[d]||y,h?M:g.a(M)},$.daysInMonth=function(){return this.endOf(u).$D},$.$locale=function(){return M[this.$L]},$.locale=function(t,e){if(!t)return this.$L;var n=this.clone(),r=D(t,e,!0);return r&&(n.$L=r),n},$.clone=function(){return g.w(this.$d,this)},$.toDate=function(){return new Date(this.valueOf())},$.toJSON=function(){return this.isValid()?this.toISOString():null},$.toISOString=function(){return this.$d.toISOString()},$.toString=function(){return this.$d.toUTCString()},d}(),p=S.prototype;return v.prototype=p,[["$ms",t],["$s",e],["$m",n],["$H",r],["$W",i],["$M",u],["$y",o],["$D",f]].forEach(function(t){p[t[1]]=function(e){return this.$g(e,t[0],t[1])};}),v.extend=function(t,e){return t.$i||(t(e,S,v),t.$i=!0),v},v.locale=D,v.isDayjs=m,v.unix=function(t){return v(1e3*t)},v.en=M[y],v.Ls=M,v.p={},v});
    });

    var updateLocale = createCommonjsModule(function (module, exports) {
    !function(e,n){module.exports=n();}(commonjsGlobal,function(){return function(e,n,t){t.updateLocale=function(e,n){var o=t.Ls[e];if(o)return (n?Object.keys(n):[]).forEach(function(e){o[e]=n[e];}),o};}});
    });

    var as_of = "2021-03-26";
    var updated_date = {
    	as_of: as_of
    };

    var type = "Topology";
    var arcs = [
    	[
    		[
    			18576,
    			5922
    		],
    		[
    			23,
    			49
    		],
    		[
    			-49,
    			33
    		],
    		[
    			10,
    			26
    		],
    		[
    			49,
    			-5
    		],
    		[
    			9,
    			11
    		],
    		[
    			0,
    			60
    		],
    		[
    			-39,
    			60
    		],
    		[
    			-2,
    			39
    		],
    		[
    			-43,
    			40
    		],
    		[
    			46,
    			24
    		],
    		[
    			-23,
    			16
    		],
    		[
    			-10,
    			36
    		],
    		[
    			-31,
    			51
    		],
    		[
    			58,
    			30
    		],
    		[
    			-5,
    			21
    		],
    		[
    			-50,
    			25
    		],
    		[
    			-2,
    			25
    		],
    		[
    			35,
    			13
    		],
    		[
    			49,
    			-37
    		],
    		[
    			30,
    			15
    		],
    		[
    			-23,
    			33
    		],
    		[
    			-29,
    			-11
    		],
    		[
    			-18,
    			16
    		],
    		[
    			22,
    			36
    		],
    		[
    			32,
    			8
    		],
    		[
    			3,
    			29
    		],
    		[
    			-17,
    			40
    		],
    		[
    			34,
    			48
    		],
    		[
    			-42,
    			21
    		],
    		[
    			-7,
    			16
    		],
    		[
    			59,
    			38
    		],
    		[
    			60,
    			12
    		],
    		[
    			9,
    			42
    		],
    		[
    			-47,
    			19
    		],
    		[
    			-6,
    			22
    		],
    		[
    			26,
    			23
    		],
    		[
    			28,
    			-18
    		],
    		[
    			26,
    			4
    		],
    		[
    			2,
    			31
    		],
    		[
    			-43,
    			-3
    		],
    		[
    			-29,
    			24
    		],
    		[
    			15,
    			24
    		],
    		[
    			37,
    			-27
    		],
    		[
    			7,
    			48
    		],
    		[
    			40,
    			13
    		],
    		[
    			13,
    			21
    		],
    		[
    			-11,
    			48
    		],
    		[
    			46,
    			5
    		],
    		[
    			39,
    			18
    		],
    		[
    			27,
    			33
    		],
    		[
    			-17,
    			42
    		],
    		[
    			24,
    			44
    		],
    		[
    			-28,
    			60
    		],
    		[
    			42,
    			14
    		],
    		[
    			29,
    			36
    		],
    		[
    			-35,
    			44
    		],
    		[
    			40,
    			15
    		],
    		[
    			-16,
    			35
    		],
    		[
    			10,
    			24
    		],
    		[
    			-18,
    			29
    		],
    		[
    			27,
    			19
    		],
    		[
    			15,
    			-39
    		],
    		[
    			60,
    			35
    		],
    		[
    			36,
    			30
    		],
    		[
    			-2,
    			35
    		],
    		[
    			-37,
    			33
    		]
    	],
    	[
    		[
    			19014,
    			7523
    		],
    		[
    			275,
    			17
    		],
    		[
    			414,
    			30
    		],
    		[
    			572,
    			49
    		]
    	],
    	[
    		[
    			20275,
    			7619
    		],
    		[
    			31,
    			-56
    		],
    		[
    			36,
    			-21
    		],
    		[
    			-15,
    			-685
    		],
    		[
    			-6,
    			-246
    		],
    		[
    			-10,
    			-512
    		],
    		[
    			-8,
    			-494
    		],
    		[
    			-10,
    			-440
    		],
    		[
    			17,
    			-153
    		],
    		[
    			77,
    			-649
    		],
    		[
    			44,
    			-388
    		]
    	],
    	[
    		[
    			20431,
    			3975
    		],
    		[
    			-34,
    			-34
    		],
    		[
    			-32,
    			-11
    		],
    		[
    			-16,
    			17
    		],
    		[
    			-87,
    			8
    		],
    		[
    			-52,
    			-16
    		],
    		[
    			-43,
    			34
    		],
    		[
    			-119,
    			-16
    		],
    		[
    			-54,
    			-19
    		],
    		[
    			-115,
    			-58
    		],
    		[
    			0,
    			28
    		],
    		[
    			-31,
    			25
    		],
    		[
    			-6,
    			-58
    		],
    		[
    			-54,
    			-42
    		],
    		[
    			-16,
    			-42
    		],
    		[
    			-47,
    			-20
    		]
    	],
    	[
    		[
    			19725,
    			3771
    		],
    		[
    			-29,
    			-3
    		],
    		[
    			-32,
    			35
    		],
    		[
    			-22,
    			48
    		],
    		[
    			8,
    			39
    		],
    		[
    			-37,
    			49
    		],
    		[
    			-2,
    			36
    		],
    		[
    			-57,
    			46
    		],
    		[
    			-38,
    			68
    		],
    		[
    			-19,
    			50
    		],
    		[
    			5,
    			75
    		],
    		[
    			27,
    			51
    		],
    		[
    			3,
    			55
    		],
    		[
    			25,
    			78
    		],
    		[
    			-17,
    			5
    		],
    		[
    			-388,
    			-27
    		],
    		[
    			-440,
    			-27
    		],
    		[
    			-350,
    			-18
    		],
    		[
    			37,
    			33
    		],
    		[
    			-4,
    			24
    		],
    		[
    			-38,
    			35
    		],
    		[
    			20,
    			62
    		],
    		[
    			-35,
    			30
    		],
    		[
    			3,
    			26
    		],
    		[
    			40,
    			-3
    		],
    		[
    			34,
    			13
    		],
    		[
    			4,
    			33
    		],
    		[
    			-25,
    			23
    		],
    		[
    			-21,
    			39
    		],
    		[
    			18,
    			28
    		],
    		[
    			23,
    			-48
    		],
    		[
    			26,
    			21
    		],
    		[
    			-27,
    			37
    		],
    		[
    			-5,
    			68
    		],
    		[
    			41,
    			9
    		],
    		[
    			25,
    			25
    		],
    		[
    			-10,
    			21
    		],
    		[
    			-39,
    			-11
    		],
    		[
    			-20,
    			19
    		],
    		[
    			10,
    			27
    		],
    		[
    			49,
    			-24
    		],
    		[
    			15,
    			27
    		],
    		[
    			-3,
    			52
    		],
    		[
    			19,
    			30
    		],
    		[
    			56,
    			1
    		],
    		[
    			-8,
    			21
    		],
    		[
    			-49,
    			-11
    		],
    		[
    			13,
    			71
    		],
    		[
    			44,
    			12
    		],
    		[
    			40,
    			38
    		],
    		[
    			6,
    			42
    		],
    		[
    			43,
    			22
    		],
    		[
    			25,
    			25
    		],
    		[
    			-16,
    			24
    		],
    		[
    			36,
    			42
    		],
    		[
    			20,
    			51
    		],
    		[
    			-29,
    			-5
    		],
    		[
    			-37,
    			-28
    		],
    		[
    			-33,
    			4
    		],
    		[
    			-3,
    			51
    		],
    		[
    			79,
    			39
    		],
    		[
    			32,
    			-22
    		],
    		[
    			2,
    			68
    		],
    		[
    			37,
    			7
    		],
    		[
    			1,
    			29
    		],
    		[
    			-58,
    			19
    		],
    		[
    			21,
    			53
    		],
    		[
    			-40,
    			-2
    		],
    		[
    			-41,
    			17
    		],
    		[
    			-15,
    			32
    		],
    		[
    			12,
    			39
    		],
    		[
    			35,
    			26
    		],
    		[
    			-10,
    			22
    		],
    		[
    			-41,
    			-20
    		],
    		[
    			-23,
    			42
    		],
    		[
    			52,
    			52
    		],
    		[
    			1,
    			20
    		],
    		[
    			-65,
    			15
    		],
    		[
    			9,
    			73
    		],
    		[
    			44,
    			38
    		],
    		[
    			2,
    			30
    		],
    		[
    			-16,
    			39
    		],
    		[
    			-30,
    			1
    		],
    		[
    			5,
    			-39
    		],
    		[
    			-17,
    			-25
    		],
    		[
    			-33,
    			16
    		],
    		[
    			26,
    			66
    		]
    	],
    	[
    		[
    			27518,
    			9518
    		],
    		[
    			21,
    			6
    		],
    		[
    			45,
    			-33
    		],
    		[
    			18,
    			-50
    		],
    		[
    			-32,
    			-2
    		],
    		[
    			-2,
    			32
    		],
    		[
    			-50,
    			47
    		]
    	],
    	[
    		[
    			27618,
    			8938
    		],
    		[
    			47,
    			34
    		],
    		[
    			45,
    			46
    		],
    		[
    			31,
    			13
    		],
    		[
    			6,
    			-38
    		],
    		[
    			-32,
    			4
    		],
    		[
    			-97,
    			-59
    		]
    	],
    	[
    		[
    			27335,
    			8597
    		],
    		[
    			48,
    			74
    		],
    		[
    			63,
    			110
    		],
    		[
    			10,
    			-2
    		],
    		[
    			-79,
    			-124
    		],
    		[
    			-42,
    			-58
    		]
    	],
    	[
    		[
    			23981,
    			9348
    		],
    		[
    			490,
    			59
    		],
    		[
    			77,
    			16
    		],
    		[
    			239,
    			27
    		],
    		[
    			455,
    			80
    		],
    		[
    			579,
    			112
    		],
    		[
    			918,
    			193
    		],
    		[
    			62,
    			19
    		],
    		[
    			540,
    			121
    		]
    	],
    	[
    		[
    			27341,
    			9975
    		],
    		[
    			58,
    			-143
    		],
    		[
    			47,
    			-93
    		],
    		[
    			49,
    			-82
    		],
    		[
    			49,
    			-64
    		],
    		[
    			77,
    			-110
    		],
    		[
    			-36,
    			16
    		],
    		[
    			-1,
    			27
    		],
    		[
    			-23,
    			26
    		],
    		[
    			-65,
    			46
    		],
    		[
    			-21,
    			79
    		],
    		[
    			-27,
    			53
    		],
    		[
    			-27,
    			19
    		],
    		[
    			-46,
    			128
    		],
    		[
    			-29,
    			11
    		],
    		[
    			-13,
    			30
    		],
    		[
    			-86,
    			3
    		],
    		[
    			27,
    			-45
    		],
    		[
    			25,
    			-2
    		],
    		[
    			38,
    			-48
    		],
    		[
    			78,
    			-136
    		],
    		[
    			33,
    			-41
    		],
    		[
    			-26,
    			-18
    		],
    		[
    			-17,
    			42
    		],
    		[
    			-36,
    			35
    		],
    		[
    			-57,
    			-34
    		],
    		[
    			-39,
    			2
    		],
    		[
    			14,
    			-45
    		],
    		[
    			-52,
    			-25
    		],
    		[
    			-23,
    			-28
    		],
    		[
    			-69,
    			16
    		],
    		[
    			-26,
    			-20
    		],
    		[
    			-37,
    			-84
    		],
    		[
    			-28,
    			-20
    		],
    		[
    			-39,
    			-6
    		],
    		[
    			-28,
    			30
    		],
    		[
    			-33,
    			-16
    		],
    		[
    			-42,
    			75
    		],
    		[
    			-19,
    			-5
    		],
    		[
    			25,
    			-53
    		],
    		[
    			41,
    			-60
    		],
    		[
    			-18,
    			-24
    		],
    		[
    			38,
    			-18
    		],
    		[
    			62,
    			20
    		],
    		[
    			83,
    			53
    		],
    		[
    			24,
    			-34
    		],
    		[
    			25,
    			10
    		],
    		[
    			21,
    			28
    		],
    		[
    			60,
    			35
    		],
    		[
    			63,
    			11
    		],
    		[
    			25,
    			-11
    		],
    		[
    			15,
    			-35
    		],
    		[
    			-19,
    			-60
    		],
    		[
    			15,
    			-34
    		],
    		[
    			8,
    			-71
    		],
    		[
    			34,
    			-44
    		],
    		[
    			2,
    			97
    		],
    		[
    			-20,
    			90
    		],
    		[
    			53,
    			84
    		],
    		[
    			39,
    			-6
    		],
    		[
    			46,
    			-51
    		],
    		[
    			16,
    			-34
    		],
    		[
    			12,
    			-68
    		],
    		[
    			21,
    			-41
    		],
    		[
    			-35,
    			-15
    		],
    		[
    			35,
    			-37
    		],
    		[
    			-16,
    			-44
    		],
    		[
    			-35,
    			-15
    		],
    		[
    			-24,
    			22
    		],
    		[
    			-15,
    			-52
    		],
    		[
    			-24,
    			-20
    		],
    		[
    			-20,
    			-73
    		],
    		[
    			-24,
    			-12
    		],
    		[
    			-9,
    			-54
    		],
    		[
    			-45,
    			-28
    		],
    		[
    			-54,
    			-18
    		],
    		[
    			-85,
    			-14
    		],
    		[
    			-23,
    			37
    		],
    		[
    			-42,
    			-10
    		],
    		[
    			-40,
    			33
    		],
    		[
    			-5,
    			33
    		],
    		[
    			15,
    			36
    		],
    		[
    			-44,
    			-4
    		],
    		[
    			-18,
    			-25
    		],
    		[
    			28,
    			-19
    		],
    		[
    			-1,
    			-22
    		],
    		[
    			27,
    			-49
    		],
    		[
    			-84,
    			15
    		],
    		[
    			-34,
    			-9
    		],
    		[
    			-131,
    			17
    		],
    		[
    			15,
    			-36
    		],
    		[
    			22,
    			16
    		],
    		[
    			51,
    			-9
    		],
    		[
    			30,
    			-20
    		],
    		[
    			50,
    			-2
    		],
    		[
    			45,
    			-18
    		],
    		[
    			20,
    			7
    		],
    		[
    			74,
    			-14
    		],
    		[
    			15,
    			-18
    		],
    		[
    			3,
    			-47
    		],
    		[
    			-16,
    			-32
    		],
    		[
    			-12,
    			-72
    		],
    		[
    			-69,
    			-92
    		],
    		[
    			-59,
    			-40
    		],
    		[
    			-91,
    			50
    		],
    		[
    			-8,
    			-40
    		],
    		[
    			31,
    			-23
    		],
    		[
    			57,
    			-17
    		],
    		[
    			54,
    			-5
    		],
    		[
    			26,
    			37
    		],
    		[
    			40,
    			37
    		],
    		[
    			75,
    			32
    		],
    		[
    			10,
    			57
    		],
    		[
    			19,
    			-10
    		],
    		[
    			24,
    			-82
    		],
    		[
    			56,
    			33
    		],
    		[
    			-35,
    			41
    		],
    		[
    			73,
    			-12
    		],
    		[
    			-9,
    			-50
    		],
    		[
    			-29,
    			-62
    		],
    		[
    			-52,
    			-64
    		],
    		[
    			-7,
    			-33
    		],
    		[
    			-83,
    			-58
    		],
    		[
    			-128,
    			-20
    		],
    		[
    			-29,
    			-10
    		],
    		[
    			-79,
    			-52
    		],
    		[
    			-48,
    			-6
    		],
    		[
    			-44,
    			-53
    		],
    		[
    			-24,
    			-50
    		],
    		[
    			-32,
    			-41
    		],
    		[
    			-88,
    			-82
    		],
    		[
    			-46,
    			-55
    		],
    		[
    			-52,
    			-75
    		],
    		[
    			-38,
    			-78
    		],
    		[
    			-23,
    			-62
    		],
    		[
    			-14,
    			-66
    		],
    		[
    			-22,
    			-156
    		],
    		[
    			-25,
    			-17
    		],
    		[
    			-70,
    			9
    		],
    		[
    			-79,
    			-11
    		],
    		[
    			-82,
    			-27
    		],
    		[
    			-90,
    			-59
    		]
    	],
    	[
    		[
    			26166,
    			7548
    		],
    		[
    			-501,
    			383
    		],
    		[
    			-77,
    			62
    		],
    		[
    			-221,
    			167
    		],
    		[
    			-116,
    			-21
    		],
    		[
    			-374,
    			-58
    		],
    		[
    			-177,
    			-28
    		],
    		[
    			-5,
    			92
    		],
    		[
    			-110,
    			118
    		],
    		[
    			-56,
    			-59
    		],
    		[
    			-14,
    			30
    		],
    		[
    			1,
    			52
    		],
    		[
    			-119,
    			-12
    		],
    		[
    			-556,
    			-63
    		],
    		[
    			-59,
    			-4
    		],
    		[
    			-55,
    			-24
    		],
    		[
    			-15,
    			25
    		],
    		[
    			-57,
    			-49
    		],
    		[
    			-27,
    			-6
    		],
    		[
    			-80,
    			-56
    		],
    		[
    			-38,
    			-37
    		],
    		[
    			-17,
    			11
    		],
    		[
    			-185,
    			-95
    		]
    	],
    	[
    		[
    			23308,
    			7976
    		],
    		[
    			-303,
    			-50
    		],
    		[
    			1,
    			-4
    		],
    		[
    			-418,
    			-55
    		]
    	],
    	[
    		[
    			22588,
    			7867
    		],
    		[
    			-3,
    			188
    		],
    		[
    			36,
    			39
    		],
    		[
    			17,
    			-17
    		],
    		[
    			54,
    			13
    		],
    		[
    			28,
    			17
    		],
    		[
    			18,
    			29
    		],
    		[
    			-15,
    			35
    		],
    		[
    			16,
    			21
    		],
    		[
    			-8,
    			31
    		],
    		[
    			27,
    			45
    		],
    		[
    			28,
    			14
    		],
    		[
    			14,
    			34
    		],
    		[
    			33,
    			10
    		],
    		[
    			28,
    			35
    		],
    		[
    			83,
    			16
    		],
    		[
    			78,
    			7
    		],
    		[
    			26,
    			42
    		],
    		[
    			74,
    			45
    		],
    		[
    			30,
    			38
    		],
    		[
    			6,
    			25
    		],
    		[
    			32,
    			7
    		],
    		[
    			12,
    			30
    		],
    		[
    			45,
    			26
    		],
    		[
    			52,
    			-5
    		],
    		[
    			38,
    			59
    		],
    		[
    			8,
    			33
    		],
    		[
    			-15,
    			33
    		],
    		[
    			33,
    			24
    		],
    		[
    			38,
    			9
    		],
    		[
    			-2,
    			28
    		],
    		[
    			81,
    			74
    		],
    		[
    			21,
    			-20
    		],
    		[
    			2,
    			-55
    		],
    		[
    			36,
    			3
    		],
    		[
    			48,
    			42
    		],
    		[
    			22,
    			64
    		],
    		[
    			65,
    			52
    		],
    		[
    			25,
    			0
    		],
    		[
    			22,
    			24
    		],
    		[
    			34,
    			-1
    		],
    		[
    			14,
    			-32
    		],
    		[
    			56,
    			20
    		],
    		[
    			53,
    			154
    		],
    		[
    			39,
    			42
    		],
    		[
    			67,
    			12
    		],
    		[
    			-21,
    			48
    		],
    		[
    			21,
    			48
    		],
    		[
    			-15,
    			52
    		],
    		[
    			12,
    			43
    		]
    	],
    	[
    		[
    			11519,
    			9160
    		],
    		[
    			177,
    			-17
    		],
    		[
    			382,
    			-29
    		]
    	],
    	[
    		[
    			12078,
    			9114
    		],
    		[
    			443,
    			-26
    		],
    		[
    			320,
    			-16
    		],
    		[
    			361,
    			-15
    		],
    		[
    			272,
    			-14
    		],
    		[
    			217,
    			-8
    		],
    		[
    			539,
    			-19
    		],
    		[
    			520,
    			-10
    		],
    		[
    			562,
    			-7
    		],
    		[
    			291,
    			0
    		],
    		[
    			347,
    			1
    		],
    		[
    			461,
    			5
    		]
    	],
    	[
    		[
    			16411,
    			9005
    		],
    		[
    			5,
    			-395
    		]
    	],
    	[
    		[
    			16416,
    			8610
    		],
    		[
    			21,
    			-158
    		],
    		[
    			103,
    			-716
    		],
    		[
    			-5,
    			-393
    		],
    		[
    			-7,
    			-994
    		]
    	],
    	[
    		[
    			16528,
    			6349
    		],
    		[
    			-36,
    			15
    		],
    		[
    			-74,
    			3
    		],
    		[
    			-23,
    			32
    		],
    		[
    			-107,
    			37
    		],
    		[
    			-71,
    			78
    		],
    		[
    			-33,
    			8
    		],
    		[
    			-9,
    			31
    		],
    		[
    			-94,
    			46
    		],
    		[
    			-21,
    			-18
    		],
    		[
    			-17,
    			-48
    		],
    		[
    			-99,
    			-10
    		],
    		[
    			-56,
    			11
    		],
    		[
    			-13,
    			37
    		],
    		[
    			-26,
    			11
    		],
    		[
    			-94,
    			-64
    		],
    		[
    			-30,
    			0
    		],
    		[
    			-27,
    			-18
    		],
    		[
    			-49,
    			36
    		],
    		[
    			-9,
    			-18
    		],
    		[
    			-66,
    			-20
    		],
    		[
    			-60,
    			1
    		],
    		[
    			-19,
    			-61
    		],
    		[
    			-31,
    			-9
    		],
    		[
    			-41,
    			14
    		],
    		[
    			-8,
    			-44
    		],
    		[
    			-17,
    			-17
    		],
    		[
    			-51,
    			69
    		],
    		[
    			-48,
    			-2
    		],
    		[
    			-16,
    			38
    		],
    		[
    			-28,
    			-1
    		],
    		[
    			-34,
    			26
    		],
    		[
    			27,
    			29
    		],
    		[
    			-53,
    			19
    		],
    		[
    			-11,
    			-50
    		],
    		[
    			-44,
    			-19
    		],
    		[
    			-19,
    			35
    		],
    		[
    			-44,
    			-12
    		],
    		[
    			-33,
    			84
    		],
    		[
    			-45,
    			-21
    		],
    		[
    			6,
    			-36
    		],
    		[
    			-39,
    			-54
    		],
    		[
    			-29,
    			-15
    		],
    		[
    			-2,
    			-55
    		],
    		[
    			-45,
    			8
    		],
    		[
    			-20,
    			52
    		],
    		[
    			24,
    			34
    		],
    		[
    			-7,
    			36
    		],
    		[
    			-41,
    			7
    		],
    		[
    			-36,
    			-11
    		],
    		[
    			-42,
    			-52
    		],
    		[
    			-32,
    			1
    		],
    		[
    			-22,
    			18
    		],
    		[
    			2,
    			49
    		],
    		[
    			-24,
    			13
    		],
    		[
    			-31,
    			-17
    		],
    		[
    			-28,
    			18
    		],
    		[
    			6,
    			25
    		],
    		[
    			-50,
    			32
    		],
    		[
    			-38,
    			-42
    		],
    		[
    			-82,
    			-68
    		],
    		[
    			-62,
    			28
    		],
    		[
    			15,
    			83
    		],
    		[
    			-83,
    			13
    		],
    		[
    			0,
    			31
    		],
    		[
    			-21,
    			34
    		],
    		[
    			18,
    			29
    		],
    		[
    			-10,
    			26
    		],
    		[
    			-37,
    			-31
    		],
    		[
    			-37,
    			17
    		],
    		[
    			-42,
    			2
    		],
    		[
    			-39,
    			18
    		],
    		[
    			-21,
    			-41
    		],
    		[
    			-55,
    			-31
    		],
    		[
    			-66,
    			79
    		],
    		[
    			-30,
    			4
    		],
    		[
    			-26,
    			-24
    		],
    		[
    			-45,
    			4
    		],
    		[
    			-93,
    			40
    		],
    		[
    			-18,
    			23
    		],
    		[
    			-30,
    			6
    		],
    		[
    			-26,
    			-15
    		],
    		[
    			-88,
    			16
    		],
    		[
    			-10,
    			98
    		],
    		[
    			-49,
    			63
    		],
    		[
    			-51,
    			35
    		],
    		[
    			-11,
    			-61
    		],
    		[
    			-62,
    			26
    		],
    		[
    			-48,
    			8
    		],
    		[
    			-13,
    			-33
    		],
    		[
    			-57,
    			5
    		],
    		[
    			-35,
    			36
    		],
    		[
    			-76,
    			104
    		],
    		[
    			-35,
    			26
    		],
    		[
    			-33,
    			-14
    		],
    		[
    			60,
    			1532
    		],
    		[
    			-306,
    			15
    		],
    		[
    			-307,
    			16
    		],
    		[
    			-384,
    			24
    		],
    		[
    			-511,
    			36
    		],
    		[
    			-253,
    			19
    		]
    	],
    	[
    		[
    			11492,
    			8766
    		],
    		[
    			27,
    			394
    		]
    	],
    	[
    		[
    			27244,
    			11100
    		],
    		[
    			9,
    			24
    		],
    		[
    			209,
    			76
    		]
    	],
    	[
    		[
    			27462,
    			11200
    		],
    		[
    			-40,
    			-121
    		],
    		[
    			-34,
    			-2
    		],
    		[
    			-34,
    			-60
    		],
    		[
    			-26,
    			-84
    		],
    		[
    			-9,
    			-105
    		],
    		[
    			14,
    			-28
    		],
    		[
    			-25,
    			-76
    		],
    		[
    			11,
    			-28
    		],
    		[
    			-44,
    			-131
    		],
    		[
    			-6,
    			-86
    		],
    		[
    			-34,
    			-69
    		],
    		[
    			-39,
    			-8
    		],
    		[
    			-40,
    			62
    		],
    		[
    			-15,
    			38
    		],
    		[
    			-4,
    			61
    		],
    		[
    			15,
    			57
    		],
    		[
    			-12,
    			10
    		],
    		[
    			1,
    			120
    		],
    		[
    			37,
    			147
    		],
    		[
    			40,
    			51
    		],
    		[
    			21,
    			87
    		],
    		[
    			-41,
    			10
    		],
    		[
    			46,
    			55
    		]
    	],
    	[
    		[
    			23708,
    			10065
    		],
    		[
    			18,
    			-21
    		],
    		[
    			-27,
    			-29
    		],
    		[
    			30,
    			-20
    		],
    		[
    			29,
    			-73
    		],
    		[
    			43,
    			-42
    		],
    		[
    			55,
    			-1
    		],
    		[
    			17,
    			-28
    		],
    		[
    			39,
    			-23
    		],
    		[
    			67,
    			15
    		],
    		[
    			63,
    			65
    		],
    		[
    			36,
    			57
    		],
    		[
    			91,
    			-68
    		],
    		[
    			59,
    			45
    		],
    		[
    			74,
    			32
    		],
    		[
    			19,
    			-2
    		],
    		[
    			51,
    			50
    		],
    		[
    			-24,
    			25
    		],
    		[
    			10,
    			36
    		],
    		[
    			45,
    			-18
    		],
    		[
    			11,
    			-16
    		],
    		[
    			35,
    			24
    		],
    		[
    			78,
    			77
    		],
    		[
    			22,
    			10
    		],
    		[
    			28,
    			-42
    		],
    		[
    			90,
    			85
    		],
    		[
    			-23,
    			40
    		],
    		[
    			53,
    			61
    		],
    		[
    			-28,
    			10
    		],
    		[
    			-22,
    			32
    		],
    		[
    			54,
    			157
    		],
    		[
    			76,
    			108
    		],
    		[
    			29,
    			98
    		],
    		[
    			-14,
    			17
    		],
    		[
    			42,
    			94
    		],
    		[
    			30,
    			33
    		],
    		[
    			-17,
    			22
    		],
    		[
    			31,
    			45
    		],
    		[
    			21,
    			66
    		],
    		[
    			-11,
    			33
    		],
    		[
    			13,
    			96
    		],
    		[
    			69,
    			-20
    		],
    		[
    			46,
    			-66
    		],
    		[
    			98,
    			-18
    		],
    		[
    			17,
    			13
    		],
    		[
    			30,
    			61
    		],
    		[
    			24,
    			133
    		],
    		[
    			20,
    			9
    		],
    		[
    			0,
    			71
    		],
    		[
    			20,
    			40
    		],
    		[
    			11,
    			49
    		],
    		[
    			81,
    			-55
    		],
    		[
    			30,
    			104
    		],
    		[
    			21,
    			38
    		],
    		[
    			33,
    			5
    		],
    		[
    			14,
    			37
    		],
    		[
    			25,
    			3
    		],
    		[
    			21,
    			47
    		],
    		[
    			-13,
    			8
    		],
    		[
    			75,
    			124
    		],
    		[
    			-24,
    			20
    		],
    		[
    			3,
    			49
    		],
    		[
    			31,
    			83
    		],
    		[
    			-19,
    			87
    		],
    		[
    			335,
    			-201
    		],
    		[
    			21,
    			136
    		],
    		[
    			12,
    			24
    		]
    	],
    	[
    		[
    			25882,
    			11896
    		],
    		[
    			60,
    			-3
    		],
    		[
    			27,
    			9
    		],
    		[
    			19,
    			-28
    		],
    		[
    			53,
    			-23
    		],
    		[
    			-27,
    			-69
    		],
    		[
    			46,
    			-47
    		],
    		[
    			70,
    			4
    		],
    		[
    			60,
    			-22
    		],
    		[
    			5,
    			-29
    		],
    		[
    			57,
    			-2
    		],
    		[
    			20,
    			-20
    		]
    	],
    	[
    		[
    			26272,
    			11666
    		],
    		[
    			34,
    			-21
    		],
    		[
    			27,
    			-34
    		],
    		[
    			5,
    			-46
    		]
    	],
    	[
    		[
    			26338,
    			11565
    		],
    		[
    			8,
    			-52
    		],
    		[
    			-43,
    			-51
    		],
    		[
    			7,
    			-30
    		]
    	],
    	[
    		[
    			26310,
    			11432
    		],
    		[
    			-38,
    			-22
    		],
    		[
    			-30,
    			-37
    		],
    		[
    			7,
    			-14
    		],
    		[
    			-19,
    			-56
    		],
    		[
    			-2,
    			-43
    		],
    		[
    			41,
    			-75
    		],
    		[
    			23,
    			-2
    		],
    		[
    			118,
    			66
    		],
    		[
    			3,
    			-56
    		],
    		[
    			47,
    			-34
    		],
    		[
    			6,
    			-33
    		],
    		[
    			77,
    			-25
    		],
    		[
    			44,
    			13
    		],
    		[
    			23,
    			-24
    		],
    		[
    			17,
    			27
    		],
    		[
    			46,
    			1
    		],
    		[
    			12,
    			-29
    		],
    		[
    			42,
    			-20
    		],
    		[
    			55,
    			-58
    		],
    		[
    			72,
    			-16
    		],
    		[
    			69,
    			-30
    		],
    		[
    			-5,
    			-60
    		],
    		[
    			-23,
    			-2
    		],
    		[
    			22,
    			-101
    		],
    		[
    			-19,
    			-61
    		],
    		[
    			-59,
    			9
    		],
    		[
    			-49,
    			0
    		],
    		[
    			-11,
    			35
    		],
    		[
    			-35,
    			44
    		],
    		[
    			-27,
    			17
    		],
    		[
    			-46,
    			8
    		],
    		[
    			24,
    			-49
    		],
    		[
    			34,
    			-1
    		],
    		[
    			29,
    			-58
    		],
    		[
    			44,
    			-34
    		],
    		[
    			54,
    			12
    		],
    		[
    			6,
    			-18
    		],
    		[
    			56,
    			-1
    		],
    		[
    			-6,
    			-48
    		],
    		[
    			68,
    			-34
    		],
    		[
    			16,
    			-56
    		],
    		[
    			-27,
    			-46
    		],
    		[
    			-29,
    			28
    		],
    		[
    			-45,
    			20
    		],
    		[
    			-9,
    			-36
    		],
    		[
    			61,
    			-66
    		],
    		[
    			-30,
    			-10
    		],
    		[
    			-49,
    			-31
    		],
    		[
    			25,
    			-14
    		],
    		[
    			41,
    			2
    		],
    		[
    			93,
    			-76
    		],
    		[
    			-6,
    			-70
    		],
    		[
    			-23,
    			6
    		],
    		[
    			-32,
    			-50
    		],
    		[
    			-40,
    			43
    		],
    		[
    			-102,
    			52
    		],
    		[
    			1,
    			31
    		],
    		[
    			-34,
    			44
    		],
    		[
    			-25,
    			-3
    		],
    		[
    			-32,
    			-33
    		],
    		[
    			-45,
    			32
    		],
    		[
    			-69,
    			-28
    		],
    		[
    			30,
    			-16
    		],
    		[
    			47,
    			15
    		],
    		[
    			67,
    			-32
    		],
    		[
    			26,
    			27
    		],
    		[
    			13,
    			-47
    		],
    		[
    			0,
    			-43
    		],
    		[
    			18,
    			-15
    		],
    		[
    			35,
    			2
    		],
    		[
    			68,
    			-43
    		],
    		[
    			10,
    			-32
    		],
    		[
    			78,
    			1
    		],
    		[
    			19,
    			64
    		],
    		[
    			47,
    			-13
    		],
    		[
    			80,
    			-7
    		],
    		[
    			24,
    			23
    		],
    		[
    			27,
    			0
    		],
    		[
    			52,
    			-119
    		],
    		[
    			54,
    			-93
    		],
    		[
    			26,
    			-59
    		]
    	],
    	[
    		[
    			23981,
    			9348
    		],
    		[
    			15,
    			22
    		],
    		[
    			-161,
    			-23
    		],
    		[
    			-4,
    			-18
    		],
    		[
    			-433,
    			-67
    		],
    		[
    			-338,
    			-50
    		],
    		[
    			-10,
    			2
    		],
    		[
    			-232,
    			-31
    		]
    	],
    	[
    		[
    			22818,
    			9183
    		],
    		[
    			77,
    			62
    		],
    		[
    			63,
    			11
    		],
    		[
    			20,
    			18
    		],
    		[
    			106,
    			58
    		],
    		[
    			33,
    			8
    		],
    		[
    			-2,
    			31
    		],
    		[
    			28,
    			61
    		],
    		[
    			59,
    			12
    		],
    		[
    			50,
    			32
    		],
    		[
    			7,
    			52
    		],
    		[
    			-10,
    			16
    		],
    		[
    			47,
    			34
    		],
    		[
    			29,
    			44
    		],
    		[
    			-6,
    			49
    		],
    		[
    			117,
    			103
    		],
    		[
    			81,
    			44
    		],
    		[
    			18,
    			25
    		],
    		[
    			173,
    			222
    		]
    	],
    	[
    		[
    			23257,
    			10702
    		],
    		[
    			38,
    			-7
    		],
    		[
    			67,
    			37
    		],
    		[
    			45,
    			15
    		],
    		[
    			5,
    			105
    		],
    		[
    			56,
    			21
    		],
    		[
    			6,
    			26
    		],
    		[
    			-15,
    			64
    		],
    		[
    			-29,
    			65
    		],
    		[
    			36,
    			42
    		],
    		[
    			-5,
    			45
    		],
    		[
    			22,
    			66
    		],
    		[
    			25,
    			43
    		],
    		[
    			36,
    			-20
    		],
    		[
    			26,
    			0
    		],
    		[
    			23,
    			-37
    		],
    		[
    			-10,
    			-30
    		],
    		[
    			24,
    			-18
    		],
    		[
    			19,
    			47
    		],
    		[
    			31,
    			34
    		],
    		[
    			4,
    			41
    		],
    		[
    			-31,
    			30
    		],
    		[
    			30,
    			29
    		],
    		[
    			-12,
    			68
    		],
    		[
    			31,
    			46
    		],
    		[
    			2,
    			37
    		],
    		[
    			61,
    			5
    		],
    		[
    			-1,
    			57
    		],
    		[
    			49,
    			64
    		],
    		[
    			30,
    			-12
    		],
    		[
    			10,
    			-24
    		],
    		[
    			28,
    			-4
    		],
    		[
    			38,
    			39
    		],
    		[
    			26,
    			4
    		],
    		[
    			16,
    			39
    		],
    		[
    			27,
    			16
    		],
    		[
    			50,
    			94
    		],
    		[
    			43,
    			58
    		],
    		[
    			28,
    			9
    		],
    		[
    			2,
    			59
    		],
    		[
    			14,
    			23
    		],
    		[
    			-23,
    			23
    		],
    		[
    			17,
    			40
    		],
    		[
    			-6,
    			33
    		],
    		[
    			16,
    			21
    		],
    		[
    			-12,
    			42
    		],
    		[
    			29,
    			46
    		],
    		[
    			-2,
    			148
    		],
    		[
    			14,
    			62
    		],
    		[
    			18,
    			29
    		],
    		[
    			6,
    			46
    		],
    		[
    			-21,
    			93
    		],
    		[
    			2,
    			36
    		],
    		[
    			-48,
    			64
    		],
    		[
    			16,
    			40
    		],
    		[
    			28,
    			1
    		],
    		[
    			29,
    			24
    		]
    	],
    	[
    		[
    			24165,
    			12626
    		],
    		[
    			110,
    			-716
    		],
    		[
    			370,
    			65
    		],
    		[
    			208,
    			39
    		]
    	],
    	[
    		[
    			24853,
    			12014
    		],
    		[
    			61,
    			-402
    		],
    		[
    			32,
    			23
    		],
    		[
    			20,
    			39
    		],
    		[
    			79,
    			89
    		],
    		[
    			59,
    			98
    		],
    		[
    			75,
    			-11
    		],
    		[
    			6,
    			39
    		],
    		[
    			28,
    			34
    		],
    		[
    			18,
    			57
    		],
    		[
    			33,
    			6
    		],
    		[
    			49,
    			-24
    		],
    		[
    			72,
    			-7
    		],
    		[
    			54,
    			8
    		],
    		[
    			24,
    			31
    		],
    		[
    			-24,
    			16
    		],
    		[
    			12,
    			42
    		],
    		[
    			36,
    			20
    		],
    		[
    			50,
    			-7
    		],
    		[
    			42,
    			70
    		],
    		[
    			56,
    			-10
    		],
    		[
    			46,
    			-43
    		],
    		[
    			42,
    			-5
    		],
    		[
    			26,
    			29
    		],
    		[
    			11,
    			-40
    		],
    		[
    			27,
    			-47
    		],
    		[
    			29,
    			-1
    		],
    		[
    			33,
    			-47
    		],
    		[
    			11,
    			-70
    		],
    		[
    			22,
    			-5
    		]
    	],
    	[
    		[
    			23708,
    			10065
    		],
    		[
    			-55,
    			-10
    		],
    		[
    			-59,
    			36
    		],
    		[
    			-18,
    			25
    		],
    		[
    			-56,
    			20
    		],
    		[
    			-43,
    			57
    		],
    		[
    			-9,
    			33
    		],
    		[
    			-37,
    			23
    		],
    		[
    			-20,
    			49
    		],
    		[
    			-51,
    			29
    		],
    		[
    			17,
    			43
    		],
    		[
    			-31,
    			8
    		],
    		[
    			-28,
    			53
    		],
    		[
    			-56,
    			46
    		],
    		[
    			11,
    			28
    		],
    		[
    			11,
    			75
    		],
    		[
    			-7,
    			50
    		],
    		[
    			-14,
    			12
    		],
    		[
    			-6,
    			60
    		]
    	],
    	[
    		[
    			19847,
    			3684
    		],
    		[
    			23,
    			27
    		],
    		[
    			47,
    			26
    		],
    		[
    			7,
    			-38
    		],
    		[
    			25,
    			-28
    		],
    		[
    			-79,
    			-1
    		],
    		[
    			-23,
    			14
    		]
    	],
    	[
    		[
    			18149,
    			3205
    		],
    		[
    			31,
    			30
    		],
    		[
    			27,
    			-2
    		],
    		[
    			23,
    			22
    		],
    		[
    			77,
    			-30
    		],
    		[
    			47,
    			-28
    		],
    		[
    			-32,
    			-26
    		],
    		[
    			-1,
    			-27
    		],
    		[
    			-50,
    			-11
    		],
    		[
    			-21,
    			18
    		],
    		[
    			-75,
    			34
    		],
    		[
    			-26,
    			20
    		]
    	],
    	[
    		[
    			16807,
    			5867
    		],
    		[
    			1119,
    			28
    		],
    		[
    			167,
    			6
    		],
    		[
    			483,
    			21
    		]
    	],
    	[
    		[
    			19725,
    			3771
    		],
    		[
    			-38,
    			-27
    		],
    		[
    			-24,
    			4
    		],
    		[
    			-57,
    			-74
    		],
    		[
    			-29,
    			-20
    		],
    		[
    			-32,
    			-2
    		],
    		[
    			-23,
    			-34
    		],
    		[
    			15,
    			-45
    		],
    		[
    			31,
    			-8
    		],
    		[
    			57,
    			-42
    		],
    		[
    			46,
    			-6
    		],
    		[
    			23,
    			15
    		],
    		[
    			13,
    			65
    		],
    		[
    			-8,
    			22
    		],
    		[
    			54,
    			41
    		],
    		[
    			39,
    			0
    		],
    		[
    			8,
    			-55
    		],
    		[
    			29,
    			-15
    		],
    		[
    			9,
    			-38
    		],
    		[
    			32,
    			25
    		],
    		[
    			23,
    			56
    		],
    		[
    			33,
    			-15
    		],
    		[
    			-9,
    			-29
    		],
    		[
    			-45,
    			-26
    		],
    		[
    			3,
    			-39
    		],
    		[
    			-43,
    			-13
    		],
    		[
    			-4,
    			-40
    		],
    		[
    			-21,
    			-40
    		],
    		[
    			6,
    			-34
    		],
    		[
    			-60,
    			-1
    		],
    		[
    			-4,
    			-39
    		],
    		[
    			-24,
    			4
    		],
    		[
    			-68,
    			-31
    		],
    		[
    			3,
    			-69
    		],
    		[
    			25,
    			-25
    		],
    		[
    			45,
    			-19
    		],
    		[
    			23,
    			-25
    		],
    		[
    			3,
    			-43
    		],
    		[
    			43,
    			15
    		],
    		[
    			56,
    			-6
    		],
    		[
    			31,
    			-24
    		],
    		[
    			28,
    			12
    		],
    		[
    			41,
    			-47
    		],
    		[
    			20,
    			33
    		],
    		[
    			60,
    			-67
    		],
    		[
    			-2,
    			-40
    		],
    		[
    			68,
    			-15
    		],
    		[
    			-27,
    			-69
    		],
    		[
    			-50,
    			-20
    		],
    		[
    			-5,
    			-39
    		],
    		[
    			-39,
    			-2
    		],
    		[
    			-4,
    			33
    		],
    		[
    			-39,
    			-12
    		],
    		[
    			-72,
    			-101
    		],
    		[
    			1,
    			32
    		],
    		[
    			32,
    			69
    		],
    		[
    			15,
    			1
    		],
    		[
    			22,
    			93
    		],
    		[
    			-28,
    			20
    		],
    		[
    			-17,
    			-58
    		],
    		[
    			-32,
    			-7
    		],
    		[
    			-58,
    			68
    		],
    		[
    			-81,
    			24
    		],
    		[
    			-23,
    			27
    		],
    		[
    			-99,
    			23
    		],
    		[
    			19,
    			18
    		],
    		[
    			45,
    			10
    		],
    		[
    			50,
    			26
    		],
    		[
    			-103,
    			-5
    		],
    		[
    			-81,
    			38
    		],
    		[
    			-51,
    			10
    		],
    		[
    			-3,
    			-28
    		],
    		[
    			-35,
    			-77
    		],
    		[
    			-42,
    			-55
    		],
    		[
    			41,
    			-58
    		],
    		[
    			-107,
    			-86
    		],
    		[
    			-63,
    			140
    		],
    		[
    			-24,
    			13
    		],
    		[
    			-31,
    			-27
    		],
    		[
    			-4,
    			41
    		],
    		[
    			-29,
    			29
    		],
    		[
    			-23,
    			-46
    		],
    		[
    			-34,
    			6
    		],
    		[
    			-35,
    			-27
    		],
    		[
    			-13,
    			-45
    		],
    		[
    			-22,
    			-35
    		],
    		[
    			-126,
    			-84
    		],
    		[
    			-34,
    			52
    		],
    		[
    			-41,
    			31
    		],
    		[
    			-67,
    			-5
    		],
    		[
    			-43,
    			26
    		],
    		[
    			-56,
    			2
    		],
    		[
    			-48,
    			20
    		],
    		[
    			-6,
    			42
    		],
    		[
    			17,
    			41
    		],
    		[
    			17,
    			-3
    		],
    		[
    			51,
    			-77
    		],
    		[
    			24,
    			-3
    		],
    		[
    			4,
    			45
    		],
    		[
    			-10,
    			27
    		],
    		[
    			-58,
    			41
    		],
    		[
    			-2,
    			31
    		],
    		[
    			-71,
    			-39
    		],
    		[
    			-12,
    			24
    		],
    		[
    			4,
    			54
    		],
    		[
    			-25,
    			15
    		],
    		[
    			-51,
    			-36
    		],
    		[
    			-18,
    			40
    		],
    		[
    			-26,
    			17
    		],
    		[
    			-22,
    			70
    		],
    		[
    			-46,
    			-8
    		],
    		[
    			3,
    			71
    		],
    		[
    			-7,
    			17
    		],
    		[
    			-93,
    			-1
    		],
    		[
    			-50,
    			-32
    		],
    		[
    			-4,
    			56
    		],
    		[
    			14,
    			39
    		],
    		[
    			-33,
    			4
    		],
    		[
    			-97,
    			-47
    		],
    		[
    			-50,
    			-35
    		],
    		[
    			-11,
    			20
    		],
    		[
    			-42,
    			-33
    		],
    		[
    			43,
    			-48
    		],
    		[
    			39,
    			-60
    		],
    		[
    			-44,
    			0
    		],
    		[
    			-68,
    			-39
    		],
    		[
    			-44,
    			-9
    		],
    		[
    			-93,
    			21
    		],
    		[
    			-119,
    			20
    		],
    		[
    			-58,
    			20
    		],
    		[
    			-146,
    			69
    		],
    		[
    			-136,
    			38
    		],
    		[
    			-48,
    			4
    		],
    		[
    			-61,
    			-14
    		],
    		[
    			-80,
    			3
    		],
    		[
    			-171,
    			-31
    		],
    		[
    			-62,
    			-37
    		]
    	],
    	[
    		[
    			16989,
    			3253
    		],
    		[
    			-56,
    			99
    		],
    		[
    			42,
    			37
    		],
    		[
    			24,
    			45
    		],
    		[
    			18,
    			55
    		],
    		[
    			29,
    			27
    		],
    		[
    			14,
    			36
    		],
    		[
    			12,
    			65
    		],
    		[
    			-16,
    			44
    		],
    		[
    			8,
    			64
    		],
    		[
    			-25,
    			11
    		],
    		[
    			-13,
    			31
    		],
    		[
    			10,
    			41
    		],
    		[
    			29,
    			33
    		],
    		[
    			-24,
    			73
    		],
    		[
    			12,
    			44
    		],
    		[
    			22,
    			6
    		],
    		[
    			-4,
    			37
    		],
    		[
    			39,
    			43
    		],
    		[
    			7,
    			42
    		],
    		[
    			33,
    			68
    		],
    		[
    			-14,
    			40
    		],
    		[
    			26,
    			32
    		],
    		[
    			-7,
    			66
    		],
    		[
    			12,
    			42
    		],
    		[
    			-21,
    			13
    		],
    		[
    			8,
    			63
    		],
    		[
    			-33,
    			4
    		],
    		[
    			-20,
    			53
    		],
    		[
    			-43,
    			66
    		],
    		[
    			11,
    			37
    		],
    		[
    			-18,
    			59
    		],
    		[
    			-33,
    			67
    		],
    		[
    			-24,
    			-2
    		],
    		[
    			-38,
    			57
    		],
    		[
    			14,
    			27
    		],
    		[
    			-7,
    			27
    		],
    		[
    			20,
    			28
    		],
    		[
    			-27,
    			36
    		],
    		[
    			7,
    			21
    		],
    		[
    			-33,
    			36
    		],
    		[
    			-15,
    			57
    		],
    		[
    			-48,
    			20
    		],
    		[
    			-28,
    			53
    		],
    		[
    			-16,
    			7
    		],
    		[
    			-16,
    			804
    		]
    	],
    	[
    		[
    			21815,
    			16512
    		],
    		[
    			14,
    			42
    		],
    		[
    			24,
    			-30
    		],
    		[
    			16,
    			34
    		],
    		[
    			46,
    			31
    		],
    		[
    			-29,
    			32
    		],
    		[
    			48,
    			8
    		],
    		[
    			45,
    			-37
    		],
    		[
    			5,
    			-20
    		],
    		[
    			38,
    			-24
    		],
    		[
    			-21,
    			-56
    		],
    		[
    			-50,
    			14
    		],
    		[
    			-83,
    			-20
    		],
    		[
    			-53,
    			26
    		]
    	],
    	[
    		[
    			21468,
    			16337
    		],
    		[
    			42,
    			4
    		],
    		[
    			82,
    			-21
    		],
    		[
    			-28,
    			-44
    		],
    		[
    			-43,
    			8
    		],
    		[
    			-53,
    			53
    		]
    	],
    	[
    		[
    			20954,
    			16107
    		],
    		[
    			5,
    			64
    		],
    		[
    			26,
    			58
    		],
    		[
    			19,
    			6
    		],
    		[
    			19,
    			-115
    		],
    		[
    			-33,
    			-32
    		],
    		[
    			-36,
    			19
    		]
    	],
    	[
    		[
    			20765,
    			15721
    		],
    		[
    			46,
    			4
    		],
    		[
    			-6,
    			-67
    		],
    		[
    			-34,
    			33
    		],
    		[
    			-6,
    			30
    		]
    	],
    	[
    		[
    			20330,
    			16782
    		],
    		[
    			28,
    			15
    		],
    		[
    			15,
    			-19
    		],
    		[
    			-12,
    			-52
    		],
    		[
    			-31,
    			56
    		]
    	],
    	[
    		[
    			20612,
    			13026
    		],
    		[
    			71,
    			71
    		],
    		[
    			30,
    			44
    		],
    		[
    			57,
    			186
    		],
    		[
    			60,
    			114
    		],
    		[
    			24,
    			86
    		],
    		[
    			17,
    			107
    		],
    		[
    			4,
    			83
    		],
    		[
    			-5,
    			33
    		],
    		[
    			6,
    			58
    		],
    		[
    			-13,
    			117
    		],
    		[
    			-19,
    			101
    		],
    		[
    			-22,
    			73
    		],
    		[
    			-110,
    			213
    		],
    		[
    			-42,
    			113
    		],
    		[
    			-39,
    			77
    		],
    		[
    			1,
    			47
    		],
    		[
    			31,
    			58
    		],
    		[
    			10,
    			45
    		],
    		[
    			-4,
    			42
    		],
    		[
    			-24,
    			89
    		],
    		[
    			-33,
    			65
    		],
    		[
    			47,
    			69
    		],
    		[
    			28,
    			91
    		],
    		[
    			32,
    			79
    		],
    		[
    			5,
    			61
    		],
    		[
    			-5,
    			48
    		],
    		[
    			8,
    			54
    		],
    		[
    			-4,
    			35
    		],
    		[
    			-23,
    			52
    		],
    		[
    			11,
    			35
    		],
    		[
    			72,
    			36
    		],
    		[
    			6,
    			63
    		],
    		[
    			-7,
    			67
    		],
    		[
    			45,
    			5
    		],
    		[
    			20,
    			52
    		],
    		[
    			35,
    			-20
    		],
    		[
    			31,
    			13
    		],
    		[
    			26,
    			86
    		],
    		[
    			28,
    			33
    		],
    		[
    			9,
    			43
    		],
    		[
    			23,
    			-12
    		],
    		[
    			21,
    			-42
    		],
    		[
    			-5,
    			-40
    		],
    		[
    			7,
    			-76
    		],
    		[
    			-20,
    			-34
    		],
    		[
    			12,
    			-85
    		],
    		[
    			22,
    			-5
    		],
    		[
    			6,
    			42
    		],
    		[
    			20,
    			46
    		],
    		[
    			-7,
    			34
    		],
    		[
    			5,
    			46
    		],
    		[
    			22,
    			16
    		],
    		[
    			-2,
    			-107
    		],
    		[
    			-26,
    			-33
    		],
    		[
    			-6,
    			-47
    		],
    		[
    			27,
    			-7
    		],
    		[
    			53,
    			152
    		],
    		[
    			5,
    			58
    		],
    		[
    			-3,
    			85
    		],
    		[
    			-19,
    			61
    		],
    		[
    			2,
    			63
    		],
    		[
    			47,
    			41
    		],
    		[
    			32,
    			40
    		],
    		[
    			33,
    			14
    		],
    		[
    			50,
    			-4
    		],
    		[
    			62,
    			33
    		],
    		[
    			-5,
    			22
    		],
    		[
    			-60,
    			3
    		],
    		[
    			-34,
    			33
    		],
    		[
    			-20,
    			66
    		],
    		[
    			18,
    			50
    		],
    		[
    			28,
    			21
    		],
    		[
    			32,
    			49
    		],
    		[
    			6,
    			39
    		],
    		[
    			44,
    			-4
    		],
    		[
    			58,
    			26
    		],
    		[
    			90,
    			-35
    		],
    		[
    			13,
    			-15
    		],
    		[
    			58,
    			-27
    		],
    		[
    			50,
    			22
    		],
    		[
    			61,
    			-15
    		],
    		[
    			46,
    			-43
    		],
    		[
    			18,
    			-49
    		],
    		[
    			107,
    			-3
    		],
    		[
    			39,
    			-35
    		],
    		[
    			39,
    			-17
    		],
    		[
    			39,
    			-3
    		],
    		[
    			56,
    			-27
    		],
    		[
    			30,
    			9
    		],
    		[
    			34,
    			-16
    		],
    		[
    			55,
    			-42
    		],
    		[
    			-13,
    			-25
    		],
    		[
    			29,
    			-49
    		],
    		[
    			28,
    			-27
    		],
    		[
    			39,
    			-82
    		],
    		[
    			-40,
    			9
    		],
    		[
    			-22,
    			24
    		],
    		[
    			-28,
    			-19
    		],
    		[
    			-8,
    			-27
    		],
    		[
    			14,
    			-55
    		],
    		[
    			47,
    			-43
    		],
    		[
    			26,
    			-4
    		],
    		[
    			25,
    			-110
    		],
    		[
    			13,
    			-17
    		],
    		[
    			-10,
    			-95
    		],
    		[
    			10,
    			-41
    		],
    		[
    			-1,
    			-78
    		],
    		[
    			7,
    			-81
    		],
    		[
    			-16,
    			-9
    		],
    		[
    			-26,
    			-51
    		],
    		[
    			-43,
    			-6
    		],
    		[
    			-17,
    			-39
    		],
    		[
    			1,
    			-97
    		],
    		[
    			-17,
    			-41
    		],
    		[
    			-34,
    			-20
    		],
    		[
    			1,
    			-38
    		],
    		[
    			-77,
    			-11
    		],
    		[
    			-33,
    			-62
    		],
    		[
    			6,
    			-83
    		],
    		[
    			-14,
    			-42
    		],
    		[
    			28,
    			-62
    		],
    		[
    			36,
    			-20
    		],
    		[
    			62,
    			-13
    		],
    		[
    			31,
    			-23
    		],
    		[
    			28,
    			35
    		],
    		[
    			32,
    			64
    		],
    		[
    			41,
    			30
    		],
    		[
    			22,
    			92
    		],
    		[
    			30,
    			29
    		],
    		[
    			-3,
    			26
    		],
    		[
    			25,
    			27
    		],
    		[
    			10,
    			34
    		],
    		[
    			93,
    			34
    		],
    		[
    			23,
    			39
    		],
    		[
    			49,
    			26
    		],
    		[
    			64,
    			-20
    		],
    		[
    			44,
    			-28
    		],
    		[
    			42,
    			-78
    		],
    		[
    			29,
    			-37
    		],
    		[
    			55,
    			-220
    		],
    		[
    			38,
    			-83
    		],
    		[
    			8,
    			-62
    		],
    		[
    			21,
    			-99
    		],
    		[
    			32,
    			-93
    		],
    		[
    			52,
    			-92
    		],
    		[
    			-17,
    			-43
    		],
    		[
    			-2,
    			-94
    		],
    		[
    			13,
    			-36
    		],
    		[
    			-13,
    			-79
    		],
    		[
    			-2,
    			-48
    		],
    		[
    			-28,
    			-48
    		],
    		[
    			-41,
    			8
    		],
    		[
    			-17,
    			41
    		],
    		[
    			20,
    			45
    		],
    		[
    			-36,
    			6
    		],
    		[
    			-55,
    			-47
    		],
    		[
    			22,
    			-50
    		],
    		[
    			-26,
    			-9
    		],
    		[
    			-17,
    			-38
    		],
    		[
    			11,
    			-54
    		],
    		[
    			-20,
    			-84
    		],
    		[
    			-72,
    			-39
    		],
    		[
    			-25,
    			-66
    		],
    		[
    			2,
    			-50
    		],
    		[
    			13,
    			-38
    		],
    		[
    			-4,
    			-30
    		],
    		[
    			-29,
    			-23
    		],
    		[
    			15,
    			-38
    		],
    		[
    			-38,
    			-39
    		],
    		[
    			1,
    			-22
    		],
    		[
    			-35,
    			-15
    		],
    		[
    			-4,
    			-34
    		],
    		[
    			-23,
    			-19
    		],
    		[
    			-26,
    			-53
    		],
    		[
    			13,
    			-44
    		],
    		[
    			-12,
    			-16
    		]
    	],
    	[
    		[
    			22446,
    			13229
    		],
    		[
    			-490,
    			-88
    		],
    		[
    			-241,
    			-39
    		]
    	],
    	[
    		[
    			21715,
    			13102
    		],
    		[
    			-5,
    			50
    		],
    		[
    			-91,
    			-12
    		],
    		[
    			-445,
    			-54
    		],
    		[
    			-396,
    			-43
    		],
    		[
    			-166,
    			-17
    		]
    	],
    	[
    		[
    			18965,
    			17697
    		],
    		[
    			38,
    			54
    		],
    		[
    			89,
    			60
    		],
    		[
    			48,
    			24
    		],
    		[
    			104,
    			80
    		],
    		[
    			3,
    			12
    		],
    		[
    			57,
    			36
    		],
    		[
    			63,
    			2
    		],
    		[
    			-68,
    			-66
    		],
    		[
    			-2,
    			-24
    		],
    		[
    			-45,
    			-44
    		],
    		[
    			-88,
    			-43
    		],
    		[
    			-72,
    			-50
    		],
    		[
    			16,
    			-27
    		],
    		[
    			-90,
    			-46
    		],
    		[
    			-53,
    			32
    		]
    	],
    	[
    		[
    			18446,
    			16641
    		],
    		[
    			42,
    			36
    		],
    		[
    			13,
    			-4
    		],
    		[
    			70,
    			38
    		],
    		[
    			68,
    			27
    		],
    		[
    			49,
    			52
    		],
    		[
    			36,
    			49
    		],
    		[
    			28,
    			20
    		],
    		[
    			59,
    			16
    		],
    		[
    			31,
    			-9
    		],
    		[
    			49,
    			21
    		],
    		[
    			50,
    			6
    		],
    		[
    			91,
    			61
    		],
    		[
    			40,
    			59
    		],
    		[
    			78,
    			16
    		],
    		[
    			17,
    			14
    		],
    		[
    			26,
    			70
    		],
    		[
    			62,
    			49
    		],
    		[
    			49,
    			58
    		],
    		[
    			38,
    			18
    		],
    		[
    			36,
    			42
    		],
    		[
    			33,
    			61
    		],
    		[
    			117,
    			80
    		],
    		[
    			121,
    			28
    		],
    		[
    			69,
    			1
    		],
    		[
    			45,
    			-22
    		],
    		[
    			-12,
    			-27
    		],
    		[
    			-35,
    			-20
    		],
    		[
    			-21,
    			6
    		],
    		[
    			-50,
    			-11
    		],
    		[
    			12,
    			-34
    		],
    		[
    			-56,
    			-39
    		],
    		[
    			-51,
    			-70
    		],
    		[
    			-34,
    			-26
    		],
    		[
    			6,
    			-31
    		],
    		[
    			-25,
    			-8
    		],
    		[
    			-6,
    			-32
    		],
    		[
    			-25,
    			-19
    		],
    		[
    			-5,
    			-45
    		],
    		[
    			-36,
    			-40
    		],
    		[
    			-11,
    			-69
    		],
    		[
    			0,
    			-47
    		],
    		[
    			27,
    			-23
    		],
    		[
    			56,
    			80
    		],
    		[
    			31,
    			34
    		],
    		[
    			48,
    			34
    		],
    		[
    			-16,
    			-51
    		],
    		[
    			51,
    			17
    		],
    		[
    			43,
    			-8
    		],
    		[
    			51,
    			8
    		],
    		[
    			82,
    			-27
    		],
    		[
    			9,
    			-29
    		],
    		[
    			26,
    			10
    		],
    		[
    			44,
    			-45
    		],
    		[
    			9,
    			-34
    		],
    		[
    			32,
    			-28
    		],
    		[
    			14,
    			-32
    		],
    		[
    			40,
    			-41
    		],
    		[
    			19,
    			-3
    		],
    		[
    			23,
    			-62
    		],
    		[
    			26,
    			-6
    		],
    		[
    			98,
    			12
    		],
    		[
    			19,
    			18
    		],
    		[
    			50,
    			14
    		],
    		[
    			21,
    			-43
    		],
    		[
    			37,
    			-22
    		],
    		[
    			30,
    			4
    		],
    		[
    			28,
    			36
    		],
    		[
    			64,
    			-47
    		],
    		[
    			38,
    			70
    		],
    		[
    			51,
    			46
    		],
    		[
    			45,
    			29
    		],
    		[
    			100,
    			86
    		],
    		[
    			27,
    			-11
    		],
    		[
    			103,
    			40
    		],
    		[
    			43,
    			-3
    		],
    		[
    			106,
    			7
    		],
    		[
    			52,
    			11
    		],
    		[
    			108,
    			70
    		],
    		[
    			49,
    			15
    		],
    		[
    			39,
    			-1
    		],
    		[
    			41,
    			16
    		],
    		[
    			-8,
    			-59
    		],
    		[
    			5,
    			-91
    		],
    		[
    			-4,
    			-53
    		],
    		[
    			23,
    			-25
    		],
    		[
    			79,
    			2
    		],
    		[
    			13,
    			-17
    		],
    		[
    			35,
    			10
    		],
    		[
    			43,
    			33
    		],
    		[
    			24,
    			1
    		],
    		[
    			24,
    			-52
    		],
    		[
    			27,
    			8
    		],
    		[
    			55,
    			70
    		],
    		[
    			84,
    			11
    		],
    		[
    			11,
    			28
    		],
    		[
    			49,
    			3
    		],
    		[
    			12,
    			-19
    		],
    		[
    			-10,
    			-69
    		],
    		[
    			23,
    			-78
    		],
    		[
    			6,
    			-68
    		],
    		[
    			-45,
    			8
    		],
    		[
    			-29,
    			-39
    		],
    		[
    			30,
    			-26
    		],
    		[
    			37,
    			17
    		],
    		[
    			32,
    			-21
    		],
    		[
    			31,
    			-6
    		],
    		[
    			-17,
    			-35
    		],
    		[
    			52,
    			-45
    		],
    		[
    			22,
    			6
    		],
    		[
    			25,
    			-31
    		],
    		[
    			-12,
    			-17
    		],
    		[
    			-48,
    			-13
    		],
    		[
    			-53,
    			12
    		],
    		[
    			-58,
    			-13
    		],
    		[
    			-29,
    			-22
    		],
    		[
    			-67,
    			-5
    		],
    		[
    			-11,
    			36
    		],
    		[
    			-46,
    			-18
    		],
    		[
    			-10,
    			24
    		],
    		[
    			-60,
    			16
    		],
    		[
    			-14,
    			-16
    		],
    		[
    			1,
    			-39
    		],
    		[
    			-19,
    			-34
    		],
    		[
    			25,
    			-73
    		],
    		[
    			-21,
    			-10
    		],
    		[
    			-40,
    			17
    		],
    		[
    			-105,
    			96
    		],
    		[
    			-68,
    			23
    		],
    		[
    			-31,
    			-2
    		],
    		[
    			-72,
    			25
    		],
    		[
    			-53,
    			3
    		],
    		[
    			-47,
    			-14
    		],
    		[
    			-56,
    			-92
    		],
    		[
    			-43,
    			-22
    		],
    		[
    			-40,
    			10
    		],
    		[
    			-41,
    			-15
    		],
    		[
    			-14,
    			-29
    		],
    		[
    			-72,
    			17
    		],
    		[
    			-69,
    			-9
    		],
    		[
    			-39,
    			-19
    		],
    		[
    			-22,
    			-32
    		],
    		[
    			3,
    			-40
    		],
    		[
    			-18,
    			-55
    		],
    		[
    			-28,
    			-2
    		],
    		[
    			-52,
    			-39
    		],
    		[
    			-19,
    			-27
    		],
    		[
    			-5,
    			-40
    		],
    		[
    			-27,
    			-42
    		],
    		[
    			-35,
    			29
    		],
    		[
    			17,
    			52
    		],
    		[
    			39,
    			50
    		],
    		[
    			25,
    			61
    		],
    		[
    			-31,
    			31
    		],
    		[
    			-36,
    			-53
    		],
    		[
    			-64,
    			14
    		],
    		[
    			8,
    			-38
    		],
    		[
    			-14,
    			-15
    		],
    		[
    			-15,
    			-60
    		],
    		[
    			-54,
    			-33
    		],
    		[
    			-18,
    			15
    		],
    		[
    			1,
    			39
    		],
    		[
    			-20,
    			56
    		],
    		[
    			-26,
    			-16
    		],
    		[
    			0,
    			-74
    		],
    		[
    			-13,
    			-25
    		],
    		[
    			-32,
    			-22
    		],
    		[
    			-38,
    			-80
    		],
    		[
    			-29,
    			-111
    		],
    		[
    			-30,
    			-51
    		],
    		[
    			-19,
    			-52
    		],
    		[
    			-46,
    			-93
    		],
    		[
    			-28,
    			-37
    		],
    		[
    			8,
    			-43
    		]
    	],
    	[
    		[
    			19977,
    			15604
    		],
    		[
    			-37,
    			7
    		],
    		[
    			-43,
    			51
    		],
    		[
    			10,
    			70
    		],
    		[
    			25,
    			61
    		],
    		[
    			-27,
    			37
    		],
    		[
    			-29,
    			-35
    		],
    		[
    			-68,
    			5
    		],
    		[
    			31,
    			82
    		],
    		[
    			0,
    			59
    		],
    		[
    			11,
    			51
    		],
    		[
    			-29,
    			45
    		],
    		[
    			2,
    			39
    		],
    		[
    			-37,
    			31
    		],
    		[
    			-112,
    			14
    		],
    		[
    			-23,
    			27
    		],
    		[
    			27,
    			35
    		],
    		[
    			-12,
    			39
    		],
    		[
    			-80,
    			30
    		],
    		[
    			-24,
    			-11
    		],
    		[
    			-47,
    			28
    		],
    		[
    			-18,
    			-14
    		],
    		[
    			-50,
    			30
    		],
    		[
    			-28,
    			-5
    		],
    		[
    			-25,
    			-24
    		],
    		[
    			-65,
    			25
    		],
    		[
    			-21,
    			-10
    		],
    		[
    			-165,
    			83
    		],
    		[
    			-536,
    			117
    		],
    		[
    			0,
    			18
    		],
    		[
    			-56,
    			108
    		],
    		[
    			-25,
    			0
    		],
    		[
    			-25,
    			26
    		],
    		[
    			-41,
    			-8
    		],
    		[
    			-14,
    			26
    		]
    	],
    	[
    		[
    			29612,
    			14431
    		],
    		[
    			78,
    			34
    		],
    		[
    			19,
    			63
    		],
    		[
    			50,
    			-59
    		],
    		[
    			-21,
    			-40
    		],
    		[
    			-56,
    			-13
    		],
    		[
    			-70,
    			15
    		]
    	],
    	[
    		[
    			29279,
    			14384
    		],
    		[
    			36,
    			15
    		],
    		[
    			21,
    			72
    		],
    		[
    			42,
    			52
    		],
    		[
    			24,
    			-3
    		],
    		[
    			19,
    			-39
    		],
    		[
    			24,
    			-5
    		],
    		[
    			26,
    			24
    		],
    		[
    			14,
    			-51
    		],
    		[
    			-127,
    			-44
    		],
    		[
    			-53,
    			-41
    		],
    		[
    			-26,
    			20
    		]
    	],
    	[
    		[
    			27742,
    			15103
    		],
    		[
    			425,
    			97
    		]
    	],
    	[
    		[
    			28167,
    			15200
    		],
    		[
    			252,
    			58
    		],
    		[
    			362,
    			88
    		],
    		[
    			16,
    			42
    		],
    		[
    			34,
    			5
    		],
    		[
    			-12,
    			40
    		],
    		[
    			22,
    			31
    		],
    		[
    			38,
    			-1
    		],
    		[
    			7,
    			45
    		],
    		[
    			48,
    			35
    		],
    		[
    			47,
    			-6
    		],
    		[
    			14,
    			13
    		]
    	],
    	[
    		[
    			28995,
    			15550
    		],
    		[
    			24,
    			-67
    		],
    		[
    			33,
    			-64
    		],
    		[
    			51,
    			-15
    		],
    		[
    			17,
    			33
    		],
    		[
    			32,
    			-21
    		],
    		[
    			-10,
    			-45
    		],
    		[
    			-33,
    			-33
    		],
    		[
    			-78,
    			-42
    		],
    		[
    			22,
    			-39
    		],
    		[
    			-34,
    			-32
    		],
    		[
    			-24,
    			-55
    		],
    		[
    			15,
    			-26
    		],
    		[
    			-22,
    			-61
    		],
    		[
    			55,
    			-24
    		],
    		[
    			16,
    			19
    		],
    		[
    			85,
    			7
    		],
    		[
    			96,
    			-105
    		],
    		[
    			6,
    			-33
    		],
    		[
    			-17,
    			-53
    		],
    		[
    			31,
    			-20
    		],
    		[
    			37,
    			9
    		],
    		[
    			25,
    			-12
    		],
    		[
    			23,
    			-49
    		],
    		[
    			1,
    			-35
    		],
    		[
    			47,
    			-30
    		],
    		[
    			55,
    			-3
    		],
    		[
    			45,
    			10
    		],
    		[
    			21,
    			-11
    		],
    		[
    			17,
    			29
    		],
    		[
    			46,
    			27
    		],
    		[
    			46,
    			37
    		],
    		[
    			7,
    			19
    		],
    		[
    			-25,
    			73
    		],
    		[
    			-41,
    			19
    		],
    		[
    			-27,
    			65
    		],
    		[
    			-38,
    			13
    		],
    		[
    			-21,
    			-32
    		],
    		[
    			-26,
    			19
    		],
    		[
    			26,
    			23
    		],
    		[
    			41,
    			0
    		],
    		[
    			53,
    			-25
    		],
    		[
    			39,
    			-44
    		],
    		[
    			42,
    			-73
    		],
    		[
    			30,
    			-77
    		],
    		[
    			10,
    			-48
    		],
    		[
    			-132,
    			-65
    		],
    		[
    			-23,
    			-23
    		],
    		[
    			-96,
    			-47
    		],
    		[
    			-19,
    			-49
    		],
    		[
    			-89,
    			-42
    		],
    		[
    			4,
    			42
    		],
    		[
    			-7,
    			53
    		],
    		[
    			-31,
    			45
    		],
    		[
    			-24,
    			-18
    		],
    		[
    			-35,
    			-74
    		],
    		[
    			-62,
    			-27
    		],
    		[
    			11,
    			-50
    		],
    		[
    			-47,
    			-55
    		],
    		[
    			-42,
    			-12
    		]
    	],
    	[
    		[
    			29101,
    			14456
    		],
    		[
    			-38,
    			122
    		],
    		[
    			-36,
    			2
    		]
    	],
    	[
    		[
    			29027,
    			14580
    		],
    		[
    			-22,
    			23
    		]
    	],
    	[
    		[
    			29005,
    			14603
    		],
    		[
    			-27,
    			26
    		],
    		[
    			-41,
    			12
    		],
    		[
    			-18,
    			29
    		],
    		[
    			-10,
    			59
    		],
    		[
    			-22,
    			-10
    		],
    		[
    			-23,
    			96
    		],
    		[
    			-218,
    			-70
    		]
    	],
    	[
    		[
    			28646,
    			14745
    		],
    		[
    			-4,
    			12
    		],
    		[
    			-664,
    			-167
    		],
    		[
    			-232,
    			-52
    		]
    	],
    	[
    		[
    			27746,
    			14538
    		],
    		[
    			-17,
    			25
    		],
    		[
    			13,
    			540
    		]
    	],
    	[
    		[
    			4944,
    			17361
    		],
    		[
    			-5,
    			85
    		],
    		[
    			28,
    			42
    		],
    		[
    			-14,
    			35
    		],
    		[
    			5,
    			74
    		],
    		[
    			-28,
    			49
    		],
    		[
    			21,
    			59
    		],
    		[
    			273,
    			1295
    		],
    		[
    			42,
    			186
    		],
    		[
    			102,
    			476
    		]
    	],
    	[
    		[
    			5368,
    			19662
    		],
    		[
    			472,
    			-109
    		]
    	],
    	[
    		[
    			5840,
    			19553
    		],
    		[
    			-157,
    			-779
    		],
    		[
    			45,
    			-105
    		],
    		[
    			30,
    			-41
    		],
    		[
    			1,
    			-50
    		],
    		[
    			41,
    			-55
    		],
    		[
    			-13,
    			-29
    		],
    		[
    			15,
    			-50
    		],
    		[
    			-39,
    			-26
    		],
    		[
    			17,
    			-27
    		],
    		[
    			-1,
    			-53
    		],
    		[
    			-30,
    			-5
    		],
    		[
    			84,
    			-95
    		],
    		[
    			3,
    			-38
    		],
    		[
    			95,
    			-56
    		],
    		[
    			24,
    			-89
    		],
    		[
    			42,
    			-48
    		],
    		[
    			1,
    			-27
    		],
    		[
    			24,
    			-39
    		],
    		[
    			4,
    			-37
    		],
    		[
    			23,
    			-12
    		],
    		[
    			21,
    			-64
    		],
    		[
    			-2,
    			-56
    		],
    		[
    			25,
    			-15
    		],
    		[
    			42,
    			-54
    		],
    		[
    			-18,
    			-33
    		],
    		[
    			16,
    			-15
    		],
    		[
    			49,
    			22
    		],
    		[
    			16,
    			-25
    		],
    		[
    			-13,
    			-23
    		],
    		[
    			8,
    			-34
    		],
    		[
    			35,
    			-3
    		],
    		[
    			38,
    			-18
    		],
    		[
    			25,
    			18
    		],
    		[
    			34,
    			-1
    		],
    		[
    			16,
    			-20
    		],
    		[
    			-20,
    			-42
    		],
    		[
    			-15,
    			-62
    		],
    		[
    			-25,
    			1
    		],
    		[
    			5,
    			-49
    		],
    		[
    			-33,
    			-37
    		],
    		[
    			-3,
    			-41
    		],
    		[
    			-32,
    			-69
    		],
    		[
    			-7,
    			-52
    		],
    		[
    			-36,
    			1
    		],
    		[
    			-8,
    			-31
    		],
    		[
    			26,
    			-27
    		],
    		[
    			-23,
    			-31
    		],
    		[
    			1,
    			-49
    		],
    		[
    			30,
    			-17
    		],
    		[
    			-16,
    			-30
    		],
    		[
    			14,
    			-46
    		],
    		[
    			-66,
    			-16
    		],
    		[
    			-39,
    			-49
    		],
    		[
    			24,
    			-47
    		],
    		[
    			-5,
    			-40
    		],
    		[
    			-38,
    			-22
    		],
    		[
    			-4,
    			-38
    		],
    		[
    			57,
    			-56
    		],
    		[
    			34,
    			-63
    		],
    		[
    			36,
    			9
    		],
    		[
    			22,
    			32
    		],
    		[
    			61,
    			13
    		],
    		[
    			76,
    			69
    		],
    		[
    			17,
    			28
    		],
    		[
    			26,
    			-11
    		],
    		[
    			5,
    			-31
    		],
    		[
    			49,
    			-54
    		],
    		[
    			3,
    			-17
    		],
    		[
    			-27,
    			-44
    		],
    		[
    			30,
    			-11
    		],
    		[
    			-16,
    			-83
    		],
    		[
    			19,
    			-15
    		],
    		[
    			-11,
    			-49
    		],
    		[
    			15,
    			-55
    		],
    		[
    			40,
    			-71
    		],
    		[
    			1,
    			-43
    		],
    		[
    			54,
    			-68
    		],
    		[
    			-9,
    			-78
    		],
    		[
    			-31,
    			-8
    		],
    		[
    			12,
    			-64
    		],
    		[
    			45,
    			-45
    		],
    		[
    			4,
    			-29
    		],
    		[
    			53,
    			20
    		],
    		[
    			62,
    			-87
    		],
    		[
    			11,
    			-42
    		],
    		[
    			-3,
    			-48
    		],
    		[
    			5,
    			-133
    		],
    		[
    			71,
    			-90
    		],
    		[
    			19,
    			11
    		],
    		[
    			-8,
    			40
    		],
    		[
    			39,
    			41
    		],
    		[
    			34,
    			9
    		],
    		[
    			26,
    			-19
    		],
    		[
    			33,
    			-3
    		],
    		[
    			106,
    			-54
    		],
    		[
    			28,
    			65
    		],
    		[
    			39,
    			19
    		],
    		[
    			29,
    			-9
    		],
    		[
    			19,
    			-28
    		],
    		[
    			42,
    			-18
    		],
    		[
    			38,
    			14
    		],
    		[
    			87,
    			-2
    		],
    		[
    			18,
    			-47
    		],
    		[
    			67,
    			29
    		],
    		[
    			92,
    			-26
    		],
    		[
    			6,
    			44
    		],
    		[
    			35,
    			44
    		],
    		[
    			-5,
    			27
    		],
    		[
    			83,
    			12
    		],
    		[
    			47,
    			-97
    		],
    		[
    			-9,
    			-34
    		],
    		[
    			23,
    			-10
    		],
    		[
    			18,
    			-59
    		],
    		[
    			38,
    			-23
    		]
    	],
    	[
    		[
    			7726,
    			15580
    		],
    		[
    			2,
    			-4
    		],
    		[
    			-147,
    			-996
    		],
    		[
    			-55,
    			-368
    		],
    		[
    			-27,
    			-170
    		],
    		[
    			-59,
    			-392
    		]
    	],
    	[
    		[
    			7440,
    			13650
    		],
    		[
    			-232,
    			38
    		],
    		[
    			-363,
    			63
    		],
    		[
    			-17,
    			7
    		],
    		[
    			-903,
    			164
    		],
    		[
    			-92,
    			23
    		]
    	],
    	[
    		[
    			5833,
    			13945
    		],
    		[
    			-298,
    			63
    		],
    		[
    			-110,
    			29
    		],
    		[
    			-122,
    			21
    		],
    		[
    			-150,
    			33
    		],
    		[
    			-562,
    			127
    		],
    		[
    			-350,
    			86
    		]
    	],
    	[
    		[
    			4241,
    			14304
    		],
    		[
    			294,
    			1392
    		],
    		[
    			11,
    			39
    		],
    		[
    			22,
    			4
    		],
    		[
    			9,
    			34
    		],
    		[
    			32,
    			48
    		],
    		[
    			8,
    			28
    		],
    		[
    			-12,
    			54
    		],
    		[
    			29,
    			11
    		],
    		[
    			26,
    			37
    		],
    		[
    			-34,
    			38
    		],
    		[
    			5,
    			35
    		],
    		[
    			-43,
    			1
    		],
    		[
    			-17,
    			44
    		],
    		[
    			-37,
    			-8
    		],
    		[
    			-19,
    			28
    		],
    		[
    			22,
    			34
    		],
    		[
    			-18,
    			52
    		],
    		[
    			20,
    			20
    		],
    		[
    			2,
    			42
    		],
    		[
    			53,
    			41
    		],
    		[
    			44,
    			85
    		],
    		[
    			40,
    			55
    		],
    		[
    			62,
    			17
    		],
    		[
    			31,
    			50
    		],
    		[
    			27,
    			19
    		],
    		[
    			18,
    			39
    		],
    		[
    			6,
    			64
    		],
    		[
    			32,
    			23
    		],
    		[
    			47,
    			53
    		],
    		[
    			29,
    			74
    		],
    		[
    			21,
    			24
    		],
    		[
    			8,
    			35
    		],
    		[
    			62,
    			83
    		],
    		[
    			20,
    			11
    		],
    		[
    			6,
    			34
    		],
    		[
    			49,
    			45
    		],
    		[
    			15,
    			28
    		],
    		[
    			-24,
    			66
    		],
    		[
    			7,
    			33
    		],
    		[
    			-22,
    			41
    		],
    		[
    			-36,
    			11
    		],
    		[
    			-10,
    			33
    		],
    		[
    			-42,
    			14
    		],
    		[
    			-2,
    			27
    		],
    		[
    			-26,
    			53
    		],
    		[
    			-12,
    			66
    		]
    	],
    	[
    		[
    			25214,
    			13
    		],
    		[
    			59,
    			44
    		],
    		[
    			-27,
    			32
    		],
    		[
    			50,
    			44
    		],
    		[
    			55,
    			38
    		],
    		[
    			52,
    			52
    		],
    		[
    			34,
    			22
    		],
    		[
    			52,
    			-18
    		],
    		[
    			8,
    			-28
    		],
    		[
    			35,
    			-25
    		],
    		[
    			21,
    			-33
    		],
    		[
    			-62,
    			-38
    		],
    		[
    			-10,
    			15
    		],
    		[
    			-68,
    			-1
    		],
    		[
    			0,
    			-23
    		],
    		[
    			-110,
    			-70
    		],
    		[
    			-85,
    			-24
    		],
    		[
    			-4,
    			13
    		]
    	],
    	[
    		[
    			24726,
    			1533
    		],
    		[
    			41,
    			-72
    		],
    		[
    			64,
    			-27
    		],
    		[
    			-4,
    			-25
    		],
    		[
    			-53,
    			26
    		],
    		[
    			-48,
    			98
    		]
    	],
    	[
    		[
    			22495,
    			3645
    		],
    		[
    			68,
    			16
    		],
    		[
    			23,
    			-8
    		],
    		[
    			-7,
    			-34
    		],
    		[
    			-28,
    			-3
    		],
    		[
    			-56,
    			29
    		]
    	],
    	[
    		[
    			22523,
    			4692
    		],
    		[
    			17,
    			-48
    		],
    		[
    			34,
    			-37
    		],
    		[
    			6,
    			-50
    		],
    		[
    			20,
    			-51
    		],
    		[
    			34,
    			-29
    		],
    		[
    			864,
    			63
    		],
    		[
    			233,
    			16
    		],
    		[
    			554,
    			42
    		],
    		[
    			44,
    			-61
    		],
    		[
    			1,
    			-48
    		],
    		[
    			32,
    			-47
    		],
    		[
    			77,
    			15
    		],
    		[
    			7,
    			90
    		],
    		[
    			-10,
    			93
    		],
    		[
    			-30,
    			44
    		],
    		[
    			-3,
    			72
    		],
    		[
    			34,
    			29
    		],
    		[
    			13,
    			42
    		],
    		[
    			74,
    			-20
    		],
    		[
    			48,
    			-1
    		],
    		[
    			31,
    			-20
    		],
    		[
    			43,
    			5
    		],
    		[
    			60,
    			-14
    		],
    		[
    			43,
    			18
    		],
    		[
    			30,
    			-8
    		]
    	],
    	[
    		[
    			24779,
    			4787
    		],
    		[
    			13,
    			-5
    		],
    		[
    			1,
    			-79
    		],
    		[
    			12,
    			-58
    		],
    		[
    			16,
    			-25
    		],
    		[
    			49,
    			-178
    		],
    		[
    			78,
    			-215
    		],
    		[
    			27,
    			-47
    		],
    		[
    			29,
    			-96
    		],
    		[
    			83,
    			-162
    		],
    		[
    			102,
    			-179
    		],
    		[
    			70,
    			-115
    		],
    		[
    			209,
    			-274
    		],
    		[
    			107,
    			-117
    		],
    		[
    			15,
    			-41
    		],
    		[
    			31,
    			-51
    		],
    		[
    			-34,
    			-47
    		],
    		[
    			1,
    			-88
    		],
    		[
    			20,
    			-76
    		],
    		[
    			25,
    			-62
    		],
    		[
    			57,
    			-102
    		],
    		[
    			108,
    			-163
    		],
    		[
    			41,
    			-90
    		],
    		[
    			80,
    			-161
    		],
    		[
    			62,
    			-104
    		],
    		[
    			92,
    			-165
    		],
    		[
    			68,
    			-163
    		],
    		[
    			21,
    			-149
    		],
    		[
    			4,
    			-133
    		],
    		[
    			9,
    			-136
    		],
    		[
    			1,
    			-132
    		],
    		[
    			25,
    			-252
    		],
    		[
    			-66,
    			-41
    		],
    		[
    			-25,
    			-127
    		],
    		[
    			-13,
    			-36
    		],
    		[
    			1,
    			-46
    		],
    		[
    			17,
    			-54
    		],
    		[
    			14,
    			-16
    		],
    		[
    			-34,
    			-45
    		],
    		[
    			-13,
    			-39
    		],
    		[
    			8,
    			-65
    		],
    		[
    			30,
    			17
    		],
    		[
    			-2,
    			54
    		],
    		[
    			53,
    			60
    		],
    		[
    			-43,
    			-122
    		],
    		[
    			-5,
    			-34
    		],
    		[
    			-22,
    			-39
    		],
    		[
    			-44,
    			11
    		],
    		[
    			6,
    			43
    		],
    		[
    			-18,
    			17
    		],
    		[
    			-78,
    			-14
    		],
    		[
    			-87,
    			-55
    		],
    		[
    			-99,
    			-5
    		],
    		[
    			-18,
    			-31
    		],
    		[
    			-119,
    			-39
    		],
    		[
    			-43,
    			25
    		],
    		[
    			-28,
    			46
    		],
    		[
    			2,
    			81
    		],
    		[
    			18,
    			14
    		],
    		[
    			-45,
    			95
    		],
    		[
    			-32,
    			24
    		],
    		[
    			1,
    			21
    		],
    		[
    			-54,
    			54
    		],
    		[
    			-21,
    			54
    		],
    		[
    			-68,
    			37
    		],
    		[
    			-26,
    			24
    		],
    		[
    			-137,
    			62
    		],
    		[
    			-44,
    			-15
    		],
    		[
    			-8,
    			-25
    		],
    		[
    			-100,
    			171
    		],
    		[
    			-43,
    			153
    		],
    		[
    			-33,
    			61
    		],
    		[
    			-76,
    			64
    		],
    		[
    			-31,
    			4
    		],
    		[
    			-1,
    			26
    		],
    		[
    			-77,
    			15
    		],
    		[
    			-23,
    			66
    		],
    		[
    			-30,
    			25
    		],
    		[
    			35,
    			20
    		],
    		[
    			23,
    			-39
    		],
    		[
    			13,
    			125
    		],
    		[
    			-10,
    			53
    		],
    		[
    			-26,
    			11
    		],
    		[
    			12,
    			52
    		],
    		[
    			-34,
    			2
    		],
    		[
    			-10,
    			-34
    		],
    		[
    			-28,
    			-5
    		],
    		[
    			26,
    			-49
    		],
    		[
    			12,
    			-50
    		],
    		[
    			-16,
    			-17
    		],
    		[
    			-50,
    			-13
    		],
    		[
    			-75,
    			92
    		],
    		[
    			-84,
    			117
    		],
    		[
    			-68,
    			122
    		],
    		[
    			-38,
    			49
    		],
    		[
    			-71,
    			79
    		],
    		[
    			-21,
    			14
    		],
    		[
    			-21,
    			50
    		],
    		[
    			43,
    			25
    		],
    		[
    			13,
    			49
    		],
    		[
    			21,
    			14
    		],
    		[
    			30,
    			88
    		],
    		[
    			19,
    			35
    		],
    		[
    			27,
    			19
    		],
    		[
    			19,
    			60
    		],
    		[
    			-21,
    			47
    		],
    		[
    			-31,
    			1
    		],
    		[
    			-12,
    			-37
    		],
    		[
    			-33,
    			-4
    		],
    		[
    			-4,
    			53
    		],
    		[
    			-17,
    			24
    		],
    		[
    			-79,
    			27
    		],
    		[
    			-25,
    			-66
    		],
    		[
    			52,
    			-14
    		],
    		[
    			44,
    			-55
    		],
    		[
    			-18,
    			-37
    		],
    		[
    			-2,
    			-66
    		],
    		[
    			-64,
    			-8
    		],
    		[
    			-43,
    			60
    		],
    		[
    			-28,
    			21
    		],
    		[
    			-22,
    			47
    		],
    		[
    			6,
    			62
    		],
    		[
    			21,
    			37
    		],
    		[
    			-5,
    			94
    		],
    		[
    			-20,
    			36
    		],
    		[
    			25,
    			44
    		],
    		[
    			15,
    			139
    		],
    		[
    			18,
    			40
    		],
    		[
    			-6,
    			62
    		],
    		[
    			9,
    			9
    		],
    		[
    			-28,
    			88
    		],
    		[
    			12,
    			18
    		],
    		[
    			-43,
    			34
    		],
    		[
    			8,
    			50
    		],
    		[
    			-34,
    			24
    		],
    		[
    			3,
    			37
    		],
    		[
    			21,
    			30
    		],
    		[
    			-58,
    			66
    		],
    		[
    			-5,
    			42
    		],
    		[
    			-35,
    			10
    		],
    		[
    			4,
    			35
    		],
    		[
    			-24,
    			26
    		],
    		[
    			-107,
    			0
    		],
    		[
    			-33,
    			-40
    		],
    		[
    			-27,
    			59
    		],
    		[
    			-7,
    			44
    		],
    		[
    			-54,
    			11
    		],
    		[
    			-6,
    			32
    		],
    		[
    			-38,
    			64
    		],
    		[
    			-48,
    			7
    		],
    		[
    			-14,
    			23
    		],
    		[
    			-61,
    			36
    		],
    		[
    			-19,
    			96
    		],
    		[
    			-61,
    			40
    		],
    		[
    			-33,
    			8
    		],
    		[
    			-35,
    			39
    		],
    		[
    			-2,
    			27
    		],
    		[
    			-39,
    			48
    		],
    		[
    			-30,
    			24
    		],
    		[
    			-74,
    			34
    		],
    		[
    			-92,
    			32
    		],
    		[
    			-68,
    			45
    		],
    		[
    			-82,
    			-35
    		],
    		[
    			-12,
    			13
    		],
    		[
    			-39,
    			-9
    		],
    		[
    			-58,
    			-46
    		],
    		[
    			-13,
    			-41
    		],
    		[
    			20,
    			-33
    		],
    		[
    			-1,
    			-35
    		],
    		[
    			-50,
    			-3
    		],
    		[
    			-20,
    			18
    		],
    		[
    			-52,
    			-22
    		],
    		[
    			-68,
    			-61
    		],
    		[
    			-136,
    			-104
    		],
    		[
    			2,
    			38
    		],
    		[
    			-28,
    			-2
    		],
    		[
    			-34,
    			-53
    		],
    		[
    			-22,
    			-12
    		],
    		[
    			-38,
    			3
    		],
    		[
    			-72,
    			-25
    		],
    		[
    			-32,
    			-21
    		],
    		[
    			-50,
    			-3
    		],
    		[
    			2,
    			93
    		],
    		[
    			-49,
    			73
    		],
    		[
    			-29,
    			28
    		],
    		[
    			-69,
    			18
    		],
    		[
    			-61,
    			55
    		],
    		[
    			-70,
    			30
    		],
    		[
    			-52,
    			39
    		],
    		[
    			-117,
    			60
    		],
    		[
    			-94,
    			32
    		],
    		[
    			-114,
    			28
    		],
    		[
    			-65,
    			9
    		],
    		[
    			-166,
    			-1
    		],
    		[
    			-72,
    			-10
    		],
    		[
    			-133,
    			-36
    		],
    		[
    			-126,
    			-42
    		],
    		[
    			-72,
    			-16
    		],
    		[
    			-28,
    			1
    		],
    		[
    			-127,
    			-44
    		]
    	],
    	[
    		[
    			20992,
    			3956
    		],
    		[
    			6,
    			34
    		],
    		[
    			25,
    			10
    		],
    		[
    			17,
    			59
    		],
    		[
    			36,
    			23
    		],
    		[
    			-44,
    			35
    		],
    		[
    			-10,
    			36
    		],
    		[
    			15,
    			29
    		],
    		[
    			11,
    			55
    		],
    		[
    			-11,
    			34
    		],
    		[
    			-84,
    			46
    		],
    		[
    			-15,
    			32
    		],
    		[
    			-33,
    			24
    		],
    		[
    			-24,
    			33
    		],
    		[
    			22,
    			80
    		],
    		[
    			-8,
    			25
    		],
    		[
    			287,
    			30
    		],
    		[
    			390,
    			35
    		],
    		[
    			393,
    			44
    		],
    		[
    			558,
    			72
    		]
    	],
    	[
    		[
    			11284,
    			13943
    		],
    		[
    			233,
    			-20
    		],
    		[
    			442,
    			-37
    		],
    		[
    			505,
    			-36
    		],
    		[
    			73,
    			-7
    		],
    		[
    			580,
    			-33
    		],
    		[
    			501,
    			-23
    		],
    		[
    			429,
    			-16
    		],
    		[
    			215,
    			-6
    		],
    		[
    			16,
    			-41
    		],
    		[
    			111,
    			-61
    		],
    		[
    			69,
    			-43
    		],
    		[
    			49,
    			-46
    		],
    		[
    			46,
    			3
    		],
    		[
    			58,
    			76
    		],
    		[
    			85,
    			-22
    		],
    		[
    			45,
    			12
    		],
    		[
    			53,
    			-1
    		],
    		[
    			34,
    			-10
    		],
    		[
    			73,
    			16
    		],
    		[
    			47,
    			-18
    		],
    		[
    			4,
    			-29
    		],
    		[
    			42,
    			-30
    		],
    		[
    			81,
    			-10
    		],
    		[
    			17,
    			-33
    		],
    		[
    			23,
    			12
    		],
    		[
    			54,
    			-24
    		],
    		[
    			2,
    			-26
    		],
    		[
    			62,
    			-15
    		],
    		[
    			-13,
    			-36
    		],
    		[
    			39,
    			-44
    		],
    		[
    			6,
    			-31
    		],
    		[
    			37,
    			5
    		],
    		[
    			31,
    			-29
    		],
    		[
    			30,
    			6
    		]
    	],
    	[
    		[
    			15363,
    			13346
    		],
    		[
    			27,
    			-6
    		],
    		[
    			8,
    			-29
    		],
    		[
    			-17,
    			-28
    		],
    		[
    			2,
    			-58
    		],
    		[
    			20,
    			-22
    		],
    		[
    			25,
    			-64
    		],
    		[
    			-18,
    			-11
    		],
    		[
    			5,
    			-38
    		],
    		[
    			44,
    			-45
    		],
    		[
    			-3,
    			-52
    		],
    		[
    			25,
    			-8
    		],
    		[
    			23,
    			-46
    		],
    		[
    			29,
    			-4
    		],
    		[
    			-17,
    			-55
    		],
    		[
    			50,
    			-78
    		],
    		[
    			-26,
    			-86
    		],
    		[
    			12,
    			-37
    		],
    		[
    			-11,
    			-19
    		],
    		[
    			17,
    			-32
    		],
    		[
    			-5,
    			-39
    		],
    		[
    			48,
    			-49
    		],
    		[
    			40,
    			-7
    		],
    		[
    			2,
    			-144
    		],
    		[
    			10,
    			-34
    		],
    		[
    			-8,
    			-34
    		],
    		[
    			33,
    			-5
    		],
    		[
    			-9,
    			-35
    		],
    		[
    			11,
    			-44
    		],
    		[
    			-1,
    			-72
    		],
    		[
    			20,
    			-20
    		],
    		[
    			-7,
    			-26
    		],
    		[
    			16,
    			-44
    		],
    		[
    			-20,
    			-16
    		],
    		[
    			6,
    			-69
    		],
    		[
    			-28,
    			-36
    		],
    		[
    			25,
    			-42
    		],
    		[
    			30,
    			-15
    		],
    		[
    			21,
    			-40
    		],
    		[
    			-8,
    			-18
    		]
    	],
    	[
    		[
    			15734,
    			11839
    		],
    		[
    			5,
    			-47
    		],
    		[
    			33,
    			2
    		],
    		[
    			3,
    			-47
    		],
    		[
    			46,
    			-123
    		],
    		[
    			31,
    			-34
    		],
    		[
    			44,
    			-22
    		],
    		[
    			1,
    			-48
    		],
    		[
    			43,
    			-44
    		],
    		[
    			-12,
    			-53
    		],
    		[
    			64,
    			-46
    		]
    	],
    	[
    		[
    			15992,
    			11377
    		],
    		[
    			-475,
    			-1
    		],
    		[
    			-611,
    			5
    		],
    		[
    			-332,
    			6
    		],
    		[
    			-489,
    			13
    		],
    		[
    			-257,
    			8
    		],
    		[
    			-361,
    			14
    		],
    		[
    			-367,
    			17
    		],
    		[
    			-526,
    			30
    		],
    		[
    			-359,
    			24
    		]
    	],
    	[
    		[
    			12215,
    			11493
    		],
    		[
    			47,
    			789
    		],
    		[
    			-449,
    			32
    		],
    		[
    			-348,
    			28
    		],
    		[
    			-306,
    			27
    		]
    	],
    	[
    		[
    			11159,
    			12369
    		],
    		[
    			27,
    			328
    		],
    		[
    			98,
    			1246
    		]
    	],
    	[
    		[
    			2610,
    			20203
    		],
    		[
    			12,
    			6
    		],
    		[
    			25,
    			-67
    		],
    		[
    			-12,
    			-11
    		],
    		[
    			-25,
    			72
    		]
    	],
    	[
    		[
    			2486,
    			19833
    		],
    		[
    			38,
    			51
    		],
    		[
    			33,
    			30
    		],
    		[
    			14,
    			34
    		],
    		[
    			37,
    			-17
    		],
    		[
    			-14,
    			-26
    		],
    		[
    			34,
    			-49
    		],
    		[
    			-17,
    			-17
    		],
    		[
    			-40,
    			22
    		],
    		[
    			-19,
    			-52
    		],
    		[
    			12,
    			-37
    		],
    		[
    			-4,
    			-105
    		],
    		[
    			32,
    			26
    		],
    		[
    			12,
    			-37
    		],
    		[
    			31,
    			-25
    		],
    		[
    			-4,
    			-65
    		],
    		[
    			-29,
    			-29
    		],
    		[
    			-21,
    			26
    		],
    		[
    			-4,
    			50
    		],
    		[
    			-30,
    			11
    		],
    		[
    			-19,
    			33
    		],
    		[
    			1,
    			38
    		],
    		[
    			17,
    			62
    		],
    		[
    			-31,
    			8
    		],
    		[
    			-29,
    			68
    		]
    	],
    	[
    		[
    			2453,
    			20046
    		],
    		[
    			27,
    			51
    		],
    		[
    			38,
    			-34
    		],
    		[
    			-7,
    			-73
    		],
    		[
    			-26,
    			-1
    		],
    		[
    			-32,
    			57
    		]
    	],
    	[
    		[
    			2442,
    			20141
    		],
    		[
    			46,
    			-17
    		],
    		[
    			-30,
    			-22
    		],
    		[
    			-16,
    			39
    		]
    	],
    	[
    		[
    			2444,
    			20172
    		],
    		[
    			70,
    			46
    		],
    		[
    			19,
    			-7
    		],
    		[
    			54,
    			-57
    		],
    		[
    			-46,
    			-32
    		],
    		[
    			-36,
    			-2
    		],
    		[
    			-29,
    			16
    		],
    		[
    			-8,
    			38
    		],
    		[
    			-24,
    			-2
    		]
    	],
    	[
    		[
    			2355,
    			20172
    		],
    		[
    			16,
    			16
    		],
    		[
    			36,
    			-10
    		],
    		[
    			34,
    			-81
    		],
    		[
    			-18,
    			-47
    		],
    		[
    			-18,
    			-2
    		],
    		[
    			-37,
    			41
    		],
    		[
    			-2,
    			64
    		],
    		[
    			-11,
    			19
    		]
    	],
    	[
    		[
    			4944,
    			17361
    		],
    		[
    			-280,
    			70
    		],
    		[
    			-755,
    			193
    		],
    		[
    			-14,
    			-12
    		],
    		[
    			-67,
    			-20
    		],
    		[
    			-64,
    			22
    		],
    		[
    			-57,
    			1
    		],
    		[
    			-82,
    			11
    		],
    		[
    			-21,
    			20
    		],
    		[
    			-29,
    			-9
    		],
    		[
    			-32,
    			-30
    		],
    		[
    			-68,
    			11
    		],
    		[
    			-86,
    			4
    		],
    		[
    			-59,
    			-15
    		],
    		[
    			-54,
    			-4
    		],
    		[
    			-27,
    			-22
    		],
    		[
    			-101,
    			7
    		],
    		[
    			-51,
    			15
    		],
    		[
    			-20,
    			36
    		],
    		[
    			-36,
    			17
    		],
    		[
    			-33,
    			-15
    		],
    		[
    			-91,
    			-10
    		],
    		[
    			-25,
    			-16
    		],
    		[
    			-22,
    			17
    		],
    		[
    			-72,
    			14
    		],
    		[
    			-31,
    			-23
    		],
    		[
    			-26,
    			5
    		],
    		[
    			-4,
    			54
    		],
    		[
    			-54,
    			43
    		],
    		[
    			-34,
    			0
    		],
    		[
    			-59,
    			45
    		],
    		[
    			-53,
    			-2
    		],
    		[
    			-54,
    			7
    		],
    		[
    			-35,
    			21
    		],
    		[
    			-30,
    			-2
    		],
    		[
    			-29,
    			-23
    		],
    		[
    			-110,
    			-25
    		],
    		[
    			-42,
    			8
    		],
    		[
    			-38,
    			-13
    		],
    		[
    			-41,
    			13
    		],
    		[
    			-19,
    			28
    		],
    		[
    			-46,
    			16
    		],
    		[
    			-92,
    			61
    		],
    		[
    			-36,
    			43
    		],
    		[
    			18,
    			57
    		],
    		[
    			-3,
    			63
    		],
    		[
    			18,
    			42
    		],
    		[
    			4,
    			74
    		],
    		[
    			-17,
    			63
    		],
    		[
    			-2,
    			44
    		],
    		[
    			-83,
    			108
    		],
    		[
    			-24,
    			11
    		],
    		[
    			-65,
    			-16
    		],
    		[
    			-45,
    			16
    		],
    		[
    			-22,
    			35
    		],
    		[
    			12,
    			36
    		],
    		[
    			-17,
    			38
    		],
    		[
    			-36,
    			3
    		]
    	],
    	[
    		[
    			1703,
    			18476
    		],
    		[
    			-58,
    			25
    		],
    		[
    			-7,
    			33
    		],
    		[
    			-51,
    			0
    		],
    		[
    			-49,
    			-21
    		],
    		[
    			-15,
    			9
    		],
    		[
    			-24,
    			60
    		],
    		[
    			-16,
    			11
    		],
    		[
    			-36,
    			-21
    		],
    		[
    			33,
    			80
    		],
    		[
    			24,
    			80
    		],
    		[
    			17,
    			82
    		],
    		[
    			18,
    			-21
    		],
    		[
    			-22,
    			-63
    		],
    		[
    			-18,
    			-91
    		],
    		[
    			31,
    			-10
    		],
    		[
    			-1,
    			74
    		],
    		[
    			58,
    			19
    		],
    		[
    			7,
    			27
    		],
    		[
    			-17,
    			57
    		],
    		[
    			65,
    			75
    		],
    		[
    			-51,
    			12
    		],
    		[
    			-14,
    			-11
    		],
    		[
    			-39,
    			45
    		],
    		[
    			14,
    			70
    		],
    		[
    			16,
    			20
    		],
    		[
    			62,
    			24
    		],
    		[
    			60,
    			-2
    		],
    		[
    			11,
    			17
    		],
    		[
    			-71,
    			37
    		],
    		[
    			3,
    			36
    		],
    		[
    			-44,
    			23
    		],
    		[
    			-18,
    			-10
    		],
    		[
    			-5,
    			-61
    		],
    		[
    			-26,
    			-6
    		],
    		[
    			34,
    			124
    		],
    		[
    			12,
    			155
    		],
    		[
    			-16,
    			21
    		],
    		[
    			-6,
    			83
    		],
    		[
    			23,
    			137
    		],
    		[
    			5,
    			132
    		],
    		[
    			-13,
    			22
    		],
    		[
    			-3,
    			45
    		],
    		[
    			-41,
    			61
    		],
    		[
    			-9,
    			25
    		],
    		[
    			1,
    			69
    		],
    		[
    			19,
    			88
    		],
    		[
    			-6,
    			53
    		],
    		[
    			29,
    			25
    		],
    		[
    			-1,
    			23
    		],
    		[
    			42,
    			60
    		],
    		[
    			-24,
    			49
    		],
    		[
    			36,
    			-5
    		],
    		[
    			40,
    			-31
    		],
    		[
    			69,
    			-91
    		],
    		[
    			63,
    			-39
    		],
    		[
    			55,
    			-55
    		],
    		[
    			16,
    			-37
    		],
    		[
    			83,
    			-45
    		],
    		[
    			78,
    			-15
    		],
    		[
    			49,
    			-42
    		],
    		[
    			23,
    			6
    		],
    		[
    			53,
    			-44
    		],
    		[
    			88,
    			-28
    		],
    		[
    			46,
    			25
    		],
    		[
    			37,
    			-49
    		],
    		[
    			5,
    			-33
    		],
    		[
    			32,
    			2
    		],
    		[
    			42,
    			-60
    		],
    		[
    			5,
    			54
    		],
    		[
    			56,
    			12
    		],
    		[
    			13,
    			-46
    		],
    		[
    			20,
    			4
    		],
    		[
    			-4,
    			-69
    		],
    		[
    			-29,
    			-15
    		],
    		[
    			14,
    			-28
    		],
    		[
    			-7,
    			-30
    		],
    		[
    			9,
    			-44
    		],
    		[
    			-67,
    			-31
    		],
    		[
    			-56,
    			-2
    		],
    		[
    			-24,
    			-33
    		],
    		[
    			-7,
    			-31
    		],
    		[
    			-32,
    			-46
    		],
    		[
    			89,
    			12
    		],
    		[
    			11,
    			35
    		],
    		[
    			48,
    			51
    		],
    		[
    			99,
    			62
    		],
    		[
    			-16,
    			-132
    		],
    		[
    			-17,
    			-34
    		],
    		[
    			-21,
    			-77
    		],
    		[
    			-26,
    			-21
    		],
    		[
    			14,
    			-42
    		],
    		[
    			-27,
    			-25
    		],
    		[
    			-21,
    			-69
    		],
    		[
    			-29,
    			-38
    		],
    		[
    			6,
    			-29
    		],
    		[
    			-25,
    			-18
    		],
    		[
    			-48,
    			40
    		],
    		[
    			24,
    			39
    		],
    		[
    			-29,
    			5
    		],
    		[
    			-19,
    			-30
    		],
    		[
    			0,
    			-58
    		],
    		[
    			-36,
    			-33
    		],
    		[
    			-14,
    			66
    		],
    		[
    			33,
    			37
    		],
    		[
    			-7,
    			36
    		],
    		[
    			-36,
    			-40
    		],
    		[
    			0,
    			-57
    		],
    		[
    			-19,
    			-26
    		],
    		[
    			30,
    			-24
    		],
    		[
    			-2,
    			-20
    		],
    		[
    			26,
    			-31
    		],
    		[
    			21,
    			-3
    		],
    		[
    			57,
    			42
    		],
    		[
    			49,
    			66
    		],
    		[
    			42,
    			-24
    		],
    		[
    			17,
    			42
    		],
    		[
    			56,
    			6
    		],
    		[
    			7,
    			30
    		],
    		[
    			-9,
    			108
    		],
    		[
    			1,
    			47
    		],
    		[
    			44,
    			14
    		],
    		[
    			-31,
    			49
    		],
    		[
    			41,
    			45
    		],
    		[
    			5,
    			61
    		],
    		[
    			35,
    			22
    		],
    		[
    			36,
    			72
    		],
    		[
    			41,
    			5
    		],
    		[
    			15,
    			36
    		],
    		[
    			-44,
    			76
    		],
    		[
    			-4,
    			31
    		],
    		[
    			16,
    			60
    		],
    		[
    			-26,
    			25
    		],
    		[
    			-32,
    			-29
    		],
    		[
    			6,
    			-48
    		],
    		[
    			-33,
    			12
    		],
    		[
    			-2,
    			41
    		],
    		[
    			16,
    			49
    		],
    		[
    			60,
    			-17
    		],
    		[
    			15,
    			54
    		],
    		[
    			-50,
    			58
    		],
    		[
    			-2,
    			41
    		],
    		[
    			-51,
    			0
    		],
    		[
    			10,
    			61
    		],
    		[
    			33,
    			18
    		],
    		[
    			26,
    			-52
    		],
    		[
    			28,
    			-7
    		],
    		[
    			22,
    			65
    		],
    		[
    			30,
    			25
    		],
    		[
    			-28,
    			61
    		],
    		[
    			7,
    			41
    		],
    		[
    			18,
    			14
    		],
    		[
    			-14,
    			32
    		],
    		[
    			-37,
    			0
    		],
    		[
    			-39,
    			44
    		],
    		[
    			3,
    			40
    		],
    		[
    			-24,
    			34
    		],
    		[
    			28,
    			28
    		],
    		[
    			-28,
    			29
    		],
    		[
    			37,
    			26
    		],
    		[
    			311,
    			-95
    		],
    		[
    			163,
    			-52
    		],
    		[
    			297,
    			-84
    		],
    		[
    			194,
    			-56
    		],
    		[
    			339,
    			-96
    		],
    		[
    			555,
    			-148
    		],
    		[
    			304,
    			-79
    		],
    		[
    			557,
    			-138
    		]
    	],
    	[
    		[
    			2427,
    			19146
    		],
    		[
    			24,
    			66
    		],
    		[
    			34,
    			21
    		],
    		[
    			-1,
    			-69
    		],
    		[
    			-25,
    			-40
    		],
    		[
    			-32,
    			22
    		]
    	],
    	[
    		[
    			8011,
    			9556
    		],
    		[
    			461,
    			-66
    		],
    		[
    			429,
    			-57
    		],
    		[
    			366,
    			-46
    		],
    		[
    			4,
    			-6
    		],
    		[
    			388,
    			-45
    		],
    		[
    			627,
    			-68
    		],
    		[
    			70,
    			-8
    		],
    		[
    			385,
    			-38
    		],
    		[
    			778,
    			-62
    		]
    	],
    	[
    		[
    			11492,
    			8766
    		],
    		[
    			-23,
    			2
    		],
    		[
    			-24,
    			-352
    		],
    		[
    			-98,
    			-1373
    		],
    		[
    			-16,
    			-244
    		],
    		[
    			-68,
    			-789
    		],
    		[
    			-55,
    			-785
    		],
    		[
    			-409,
    			34
    		],
    		[
    			-376,
    			34
    		],
    		[
    			-322,
    			31
    		],
    		[
    			-387,
    			40
    		],
    		[
    			-710,
    			80
    		],
    		[
    			-22,
    			-103
    		],
    		[
    			32,
    			-48
    		],
    		[
    			28,
    			-25
    		]
    	],
    	[
    		[
    			9042,
    			5268
    		],
    		[
    			-554,
    			69
    		],
    		[
    			-487,
    			65
    		],
    		[
    			-43,
    			-351
    		],
    		[
    			-524,
    			74
    		]
    	],
    	[
    		[
    			7434,
    			5125
    		],
    		[
    			148,
    			1126
    		],
    		[
    			48,
    			369
    		],
    		[
    			174,
    			1338
    		],
    		[
    			40,
    			316
    		],
    		[
    			167,
    			1282
    		]
    	],
    	[
    		[
    			11407,
    			15511
    		],
    		[
    			9,
    			0
    		],
    		[
    			23,
    			294
    		],
    		[
    			33,
    			447
    		]
    	],
    	[
    		[
    			11472,
    			16252
    		],
    		[
    			250,
    			-22
    		],
    		[
    			327,
    			-27
    		],
    		[
    			381,
    			-28
    		],
    		[
    			389,
    			-26
    		],
    		[
    			641,
    			-36
    		],
    		[
    			350,
    			-16
    		],
    		[
    			552,
    			-22
    		],
    		[
    			324,
    			-8
    		],
    		[
    			222,
    			-4
    		],
    		[
    			406,
    			-5
    		]
    	],
    	[
    		[
    			15314,
    			16058
    		],
    		[
    			-9,
    			-85
    		],
    		[
    			-37,
    			-62
    		],
    		[
    			-98,
    			-79
    		],
    		[
    			-9,
    			-31
    		],
    		[
    			47,
    			-67
    		],
    		[
    			17,
    			-50
    		],
    		[
    			26,
    			-37
    		],
    		[
    			33,
    			-2
    		],
    		[
    			66,
    			-41
    		],
    		[
    			19,
    			-46
    		],
    		[
    			-1,
    			-456
    		],
    		[
    			-6,
    			-959
    		]
    	],
    	[
    		[
    			15362,
    			14143
    		],
    		[
    			-77,
    			0
    		],
    		[
    			2,
    			-52
    		],
    		[
    			37,
    			-31
    		],
    		[
    			-1,
    			-65
    		],
    		[
    			-30,
    			-19
    		],
    		[
    			5,
    			-39
    		],
    		[
    			46,
    			-12
    		],
    		[
    			10,
    			-59
    		],
    		[
    			14,
    			-28
    		],
    		[
    			-8,
    			-31
    		],
    		[
    			-30,
    			-39
    		],
    		[
    			-17,
    			-79
    		],
    		[
    			7,
    			-27
    		],
    		[
    			-61,
    			-121
    		],
    		[
    			5,
    			-25
    		],
    		[
    			30,
    			-18
    		],
    		[
    			31,
    			-42
    		],
    		[
    			21,
    			-59
    		],
    		[
    			1,
    			-52
    		],
    		[
    			16,
    			1
    		]
    	],
    	[
    		[
    			11284,
    			13943
    		],
    		[
    			52,
    			664
    		],
    		[
    			64,
    			808
    		],
    		[
    			7,
    			96
    		]
    	],
    	[
    		[
    			16170,
    			2768
    		],
    		[
    			17,
    			24
    		],
    		[
    			97,
    			81
    		],
    		[
    			45,
    			54
    		],
    		[
    			49,
    			15
    		],
    		[
    			2,
    			-18
    		],
    		[
    			-210,
    			-156
    		]
    	],
    	[
    		[
    			14678,
    			1040
    		],
    		[
    			10,
    			168
    		],
    		[
    			-5,
    			31
    		],
    		[
    			9,
    			95
    		],
    		[
    			15,
    			88
    		],
    		[
    			17,
    			34
    		],
    		[
    			22,
    			81
    		],
    		[
    			44,
    			97
    		],
    		[
    			28,
    			17
    		],
    		[
    			47,
    			134
    		],
    		[
    			47,
    			-3
    		],
    		[
    			-35,
    			-48
    		],
    		[
    			-60,
    			-109
    		],
    		[
    			-52,
    			-113
    		],
    		[
    			-30,
    			-82
    		],
    		[
    			-26,
    			-100
    		],
    		[
    			-15,
    			-108
    		],
    		[
    			-1,
    			-110
    		],
    		[
    			8,
    			-74
    		],
    		[
    			16,
    			-88
    		],
    		[
    			4,
    			-83
    		],
    		[
    			-39,
    			133
    		],
    		[
    			-4,
    			40
    		]
    	],
    	[
    		[
    			16528,
    			6349
    		],
    		[
    			23,
    			-2
    		],
    		[
    			37,
    			-69
    		],
    		[
    			55,
    			25
    		],
    		[
    			83,
    			11
    		],
    		[
    			8,
    			-18
    		],
    		[
    			41,
    			9
    		],
    		[
    			24,
    			-18
    		],
    		[
    			8,
    			-420
    		]
    	],
    	[
    		[
    			16989,
    			3253
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-104,
    			0
    		],
    		[
    			-61,
    			-18
    		],
    		[
    			-251,
    			-122
    		],
    		[
    			-90,
    			-48
    		],
    		[
    			2,
    			19
    		],
    		[
    			42,
    			44
    		],
    		[
    			10,
    			32
    		],
    		[
    			-139,
    			-39
    		],
    		[
    			39,
    			90
    		],
    		[
    			7,
    			43
    		],
    		[
    			-10,
    			47
    		],
    		[
    			-33,
    			21
    		],
    		[
    			-39,
    			-18
    		],
    		[
    			-22,
    			-30
    		],
    		[
    			-14,
    			-39
    		],
    		[
    			-31,
    			-11
    		],
    		[
    			-14,
    			31
    		],
    		[
    			-25,
    			-17
    		],
    		[
    			-21,
    			-35
    		],
    		[
    			21,
    			-24
    		],
    		[
    			-20,
    			-48
    		],
    		[
    			41,
    			-56
    		],
    		[
    			39,
    			-26
    		],
    		[
    			-2,
    			-101
    		],
    		[
    			-16,
    			-19
    		],
    		[
    			-32,
    			-1
    		],
    		[
    			-39,
    			-54
    		],
    		[
    			-44,
    			-30
    		],
    		[
    			-31,
    			4
    		],
    		[
    			-11,
    			-46
    		],
    		[
    			28,
    			-39
    		],
    		[
    			-82,
    			-73
    		],
    		[
    			-84,
    			-86
    		],
    		[
    			-53,
    			-19
    		],
    		[
    			-198,
    			-125
    		],
    		[
    			-77,
    			-44
    		],
    		[
    			-125,
    			-59
    		],
    		[
    			-122,
    			-73
    		],
    		[
    			-78,
    			-62
    		],
    		[
    			-34,
    			-50
    		],
    		[
    			-77,
    			-41
    		],
    		[
    			-126,
    			-95
    		],
    		[
    			-65,
    			-61
    		],
    		[
    			-73,
    			-82
    		],
    		[
    			-4,
    			48
    		],
    		[
    			29,
    			55
    		],
    		[
    			34,
    			35
    		],
    		[
    			19,
    			-20
    		],
    		[
    			22,
    			13
    		],
    		[
    			-7,
    			31
    		],
    		[
    			23,
    			19
    		],
    		[
    			58,
    			9
    		],
    		[
    			76,
    			77
    		],
    		[
    			92,
    			32
    		],
    		[
    			-8,
    			59
    		],
    		[
    			-86,
    			-52
    		],
    		[
    			-26,
    			-27
    		],
    		[
    			-39,
    			-1
    		],
    		[
    			-13,
    			27
    		],
    		[
    			-1,
    			43
    		],
    		[
    			-52,
    			-1
    		],
    		[
    			-33,
    			24
    		],
    		[
    			-13,
    			-19
    		],
    		[
    			38,
    			-34
    		],
    		[
    			5,
    			-33
    		],
    		[
    			-12,
    			-25
    		],
    		[
    			16,
    			-37
    		],
    		[
    			-41,
    			-49
    		],
    		[
    			-56,
    			-44
    		],
    		[
    			-34,
    			2
    		],
    		[
    			-27,
    			19
    		],
    		[
    			-3,
    			31
    		],
    		[
    			-76,
    			-37
    		],
    		[
    			-51,
    			-49
    		],
    		[
    			55,
    			-40
    		],
    		[
    			26,
    			40
    		],
    		[
    			41,
    			-2
    		],
    		[
    			-5,
    			-38
    		],
    		[
    			-98,
    			-158
    		],
    		[
    			-20,
    			1
    		],
    		[
    			-18,
    			41
    		],
    		[
    			-135,
    			-2
    		],
    		[
    			-27,
    			8
    		],
    		[
    			-12,
    			-23
    		],
    		[
    			34,
    			-22
    		],
    		[
    			50,
    			12
    		],
    		[
    			-5,
    			-45
    		],
    		[
    			32,
    			-46
    		],
    		[
    			57,
    			-26
    		],
    		[
    			-45,
    			-95
    		],
    		[
    			-31,
    			-98
    		],
    		[
    			-1,
    			-25
    		],
    		[
    			-31,
    			-69
    		],
    		[
    			-45,
    			-18
    		],
    		[
    			-9,
    			59
    		],
    		[
    			-74,
    			-66
    		],
    		[
    			-55,
    			38
    		],
    		[
    			39,
    			-72
    		],
    		[
    			67,
    			-12
    		],
    		[
    			61,
    			26
    		],
    		[
    			10,
    			-4
    		],
    		[
    			-14,
    			-73
    		],
    		[
    			5,
    			-15
    		],
    		[
    			-8,
    			-123
    		],
    		[
    			-13,
    			-108
    		],
    		[
    			-12,
    			-32
    		],
    		[
    			8,
    			-87
    		],
    		[
    			27,
    			-124
    		],
    		[
    			26,
    			-43
    		],
    		[
    			54,
    			-144
    		],
    		[
    			10,
    			-13
    		],
    		[
    			-24,
    			-43
    		],
    		[
    			30,
    			-108
    		],
    		[
    			41,
    			-5
    		],
    		[
    			8,
    			-26
    		],
    		[
    			29,
    			-6
    		],
    		[
    			3,
    			-67
    		],
    		[
    			-52,
    			5
    		],
    		[
    			-95,
    			-42
    		],
    		[
    			-5,
    			-48
    		],
    		[
    			-47,
    			7
    		],
    		[
    			-10,
    			28
    		],
    		[
    			-41,
    			2
    		],
    		[
    			-7,
    			23
    		],
    		[
    			-35,
    			18
    		],
    		[
    			-41,
    			54
    		],
    		[
    			-38,
    			20
    		],
    		[
    			-50,
    			-1
    		],
    		[
    			-15,
    			24
    		],
    		[
    			-58,
    			7
    		],
    		[
    			-54,
    			-11
    		],
    		[
    			-22,
    			11
    		],
    		[
    			-26,
    			-18
    		],
    		[
    			-44,
    			22
    		],
    		[
    			-26,
    			-14
    		],
    		[
    			-21,
    			21
    		],
    		[
    			-48,
    			-2
    		],
    		[
    			-15,
    			34
    		],
    		[
    			-32,
    			3
    		],
    		[
    			-12,
    			27
    		],
    		[
    			-30,
    			4
    		],
    		[
    			-51,
    			56
    		],
    		[
    			-26,
    			-12
    		],
    		[
    			-57,
    			39
    		],
    		[
    			-55,
    			-15
    		],
    		[
    			-56,
    			75
    		],
    		[
    			-33,
    			31
    		],
    		[
    			-23,
    			-8
    		],
    		[
    			-113,
    			30
    		],
    		[
    			-16,
    			17
    		],
    		[
    			-30,
    			-12
    		],
    		[
    			-19,
    			24
    		],
    		[
    			14,
    			39
    		],
    		[
    			-23,
    			38
    		],
    		[
    			-26,
    			9
    		],
    		[
    			-5,
    			66
    		],
    		[
    			-14,
    			28
    		],
    		[
    			-4,
    			54
    		],
    		[
    			-20,
    			17
    		],
    		[
    			-1,
    			33
    		],
    		[
    			-16,
    			43
    		],
    		[
    			-39,
    			30
    		],
    		[
    			-4,
    			34
    		],
    		[
    			-33,
    			18
    		],
    		[
    			8,
    			22
    		],
    		[
    			-24,
    			35
    		],
    		[
    			-20,
    			6
    		],
    		[
    			17,
    			118
    		],
    		[
    			-8,
    			58
    		],
    		[
    			-36,
    			18
    		],
    		[
    			-3,
    			53
    		],
    		[
    			20,
    			108
    		],
    		[
    			-32,
    			17
    		],
    		[
    			13,
    			50
    		],
    		[
    			-19,
    			34
    		],
    		[
    			-39,
    			29
    		],
    		[
    			-24,
    			-11
    		],
    		[
    			-19,
    			27
    		],
    		[
    			-34,
    			6
    		],
    		[
    			-30,
    			53
    		],
    		[
    			-42,
    			26
    		],
    		[
    			-27,
    			30
    		],
    		[
    			-7,
    			73
    		],
    		[
    			-28,
    			49
    		],
    		[
    			6,
    			20
    		],
    		[
    			-38,
    			11
    		],
    		[
    			-16,
    			57
    		],
    		[
    			-22,
    			17
    		],
    		[
    			-18,
    			47
    		],
    		[
    			-82,
    			45
    		],
    		[
    			-51,
    			71
    		],
    		[
    			5,
    			25
    		],
    		[
    			-37,
    			69
    		],
    		[
    			10,
    			21
    		],
    		[
    			-45,
    			97
    		],
    		[
    			8,
    			27
    		],
    		[
    			-30,
    			19
    		],
    		[
    			3,
    			25
    		],
    		[
    			-34,
    			16
    		],
    		[
    			-3,
    			64
    		],
    		[
    			-23,
    			68
    		],
    		[
    			-62,
    			94
    		],
    		[
    			4,
    			34
    		],
    		[
    			-14,
    			90
    		],
    		[
    			-40,
    			33
    		],
    		[
    			-34,
    			86
    		],
    		[
    			-51,
    			30
    		],
    		[
    			-4,
    			21
    		],
    		[
    			-39,
    			33
    		],
    		[
    			-34,
    			16
    		],
    		[
    			-33,
    			75
    		],
    		[
    			-58,
    			18
    		],
    		[
    			-12,
    			30
    		],
    		[
    			-55,
    			21
    		],
    		[
    			14,
    			21
    		],
    		[
    			-45,
    			19
    		],
    		[
    			10,
    			42
    		],
    		[
    			-45,
    			34
    		],
    		[
    			-20,
    			72
    		],
    		[
    			-27,
    			-12
    		],
    		[
    			-33,
    			11
    		],
    		[
    			-40,
    			29
    		],
    		[
    			-52,
    			-31
    		],
    		[
    			-41,
    			9
    		],
    		[
    			-57,
    			36
    		],
    		[
    			-51,
    			-5
    		],
    		[
    			-62,
    			22
    		],
    		[
    			-60,
    			-19
    		],
    		[
    			-54,
    			26
    		],
    		[
    			-87,
    			55
    		],
    		[
    			-26,
    			-4
    		],
    		[
    			-49,
    			-79
    		],
    		[
    			-48,
    			21
    		],
    		[
    			-42,
    			-30
    		],
    		[
    			-14,
    			10
    		],
    		[
    			-78,
    			-22
    		],
    		[
    			-11,
    			-38
    		],
    		[
    			-26,
    			-29
    		],
    		[
    			-1,
    			-26
    		],
    		[
    			-48,
    			-56
    		],
    		[
    			-18,
    			-60
    		],
    		[
    			-10,
    			-67
    		],
    		[
    			-25,
    			-1
    		],
    		[
    			-23,
    			-71
    		],
    		[
    			22,
    			-32
    		],
    		[
    			-86,
    			-31
    		],
    		[
    			-28,
    			-58
    		],
    		[
    			-29,
    			-7
    		],
    		[
    			-15,
    			-46
    		],
    		[
    			-39,
    			-40
    		],
    		[
    			-71,
    			25
    		],
    		[
    			-94,
    			41
    		],
    		[
    			-80,
    			99
    		],
    		[
    			-107,
    			29
    		],
    		[
    			-36,
    			69
    		],
    		[
    			-86,
    			23
    		],
    		[
    			-63,
    			27
    		],
    		[
    			-53,
    			54
    		],
    		[
    			-37,
    			21
    		],
    		[
    			-20,
    			68
    		],
    		[
    			-32,
    			29
    		],
    		[
    			-48,
    			9
    		],
    		[
    			-36,
    			45
    		],
    		[
    			-70,
    			60
    		],
    		[
    			-13,
    			31
    		],
    		[
    			-2,
    			49
    		],
    		[
    			-34,
    			86
    		],
    		[
    			-34,
    			54
    		],
    		[
    			-12,
    			112
    		],
    		[
    			16,
    			23
    		],
    		[
    			6,
    			76
    		],
    		[
    			-39,
    			100
    		],
    		[
    			-27,
    			51
    		],
    		[
    			-29,
    			25
    		],
    		[
    			0,
    			95
    		],
    		[
    			-13,
    			48
    		],
    		[
    			-43,
    			36
    		],
    		[
    			-17,
    			62
    		],
    		[
    			-27,
    			-2
    		],
    		[
    			-40,
    			59
    		],
    		[
    			-26,
    			5
    		],
    		[
    			-31,
    			45
    		],
    		[
    			-26,
    			-7
    		],
    		[
    			-20,
    			27
    		],
    		[
    			-63,
    			25
    		],
    		[
    			-8,
    			41
    		],
    		[
    			-83,
    			79
    		],
    		[
    			-24,
    			79
    		],
    		[
    			-24,
    			27
    		],
    		[
    			-74,
    			48
    		],
    		[
    			-51,
    			102
    		],
    		[
    			-38,
    			23
    		],
    		[
    			-9,
    			42
    		],
    		[
    			-30,
    			26
    		],
    		[
    			-43,
    			8
    		],
    		[
    			-84,
    			77
    		],
    		[
    			-11,
    			46
    		],
    		[
    			-21,
    			21
    		],
    		[
    			-11,
    			55
    		],
    		[
    			-37,
    			85
    		],
    		[
    			-41,
    			30
    		],
    		[
    			-25,
    			-9
    		],
    		[
    			-22,
    			30
    		]
    	],
    	[
    		[
    			1915,
    			7961
    		],
    		[
    			35,
    			-13
    		],
    		[
    			86,
    			-74
    		],
    		[
    			29,
    			-69
    		],
    		[
    			-15,
    			-25
    		],
    		[
    			-26,
    			24
    		],
    		[
    			-39,
    			9
    		],
    		[
    			-22,
    			32
    		],
    		[
    			11,
    			53
    		],
    		[
    			-42,
    			23
    		],
    		[
    			-17,
    			40
    		]
    	],
    	[
    		[
    			1834,
    			7620
    		],
    		[
    			19,
    			-4
    		],
    		[
    			35,
    			-99
    		],
    		[
    			54,
    			-82
    		],
    		[
    			-41,
    			-20
    		],
    		[
    			-36,
    			51
    		],
    		[
    			-14,
    			51
    		],
    		[
    			-17,
    			103
    		]
    	],
    	[
    		[
    			1302,
    			7960
    		],
    		[
    			30,
    			-2
    		],
    		[
    			35,
    			-33
    		],
    		[
    			-13,
    			-31
    		],
    		[
    			-42,
    			26
    		],
    		[
    			-10,
    			40
    		]
    	],
    	[
    		[
    			1236,
    			8615
    		],
    		[
    			45,
    			-3
    		],
    		[
    			19,
    			-21
    		],
    		[
    			36,
    			-5
    		],
    		[
    			36,
    			-41
    		],
    		[
    			39,
    			-13
    		],
    		[
    			20,
    			21
    		],
    		[
    			37,
    			-17
    		],
    		[
    			-17,
    			-24
    		],
    		[
    			-71,
    			3
    		],
    		[
    			-35,
    			-10
    		],
    		[
    			-61,
    			15
    		],
    		[
    			-29,
    			25
    		],
    		[
    			8,
    			40
    		],
    		[
    			-27,
    			30
    		]
    	],
    	[
    		[
    			1038,
    			8623
    		],
    		[
    			49,
    			-9
    		],
    		[
    			22,
    			8
    		],
    		[
    			36,
    			-11
    		],
    		[
    			33,
    			-46
    		],
    		[
    			-5,
    			-29
    		],
    		[
    			-80,
    			-16
    		],
    		[
    			-28,
    			34
    		],
    		[
    			-27,
    			69
    		]
    	],
    	[
    		[
    			926,
    			8680
    		],
    		[
    			59,
    			15
    		],
    		[
    			-9,
    			-45
    		],
    		[
    			-50,
    			30
    		]
    	],
    	[
    		[
    			458,
    			15372
    		],
    		[
    			110,
    			-37
    		],
    		[
    			341,
    			-107
    		],
    		[
    			107,
    			-26
    		],
    		[
    			52,
    			-21
    		],
    		[
    			174,
    			-53
    		],
    		[
    			176,
    			-49
    		],
    		[
    			540,
    			-172
    		],
    		[
    			169,
    			-51
    		],
    		[
    			366,
    			-104
    		],
    		[
    			173,
    			-46
    		]
    	],
    	[
    		[
    			2666,
    			14706
    		],
    		[
    			-208,
    			-859
    		],
    		[
    			-67,
    			-287
    		],
    		[
    			-102,
    			-416
    		],
    		[
    			-140,
    			-560
    		],
    		[
    			-39,
    			-173
    		],
    		[
    			266,
    			-426
    		],
    		[
    			285,
    			-455
    		],
    		[
    			367,
    			-586
    		],
    		[
    			72,
    			-117
    		],
    		[
    			317,
    			-505
    		],
    		[
    			568,
    			-909
    		],
    		[
    			520,
    			-830
    		]
    	],
    	[
    		[
    			4505,
    			8583
    		],
    		[
    			-18,
    			-105
    		],
    		[
    			22,
    			-29
    		],
    		[
    			10,
    			-58
    		],
    		[
    			40,
    			-52
    		],
    		[
    			4,
    			-94
    		],
    		[
    			24,
    			-59
    		],
    		[
    			-14,
    			-55
    		],
    		[
    			25,
    			-11
    		],
    		[
    			57,
    			-80
    		],
    		[
    			27,
    			-19
    		],
    		[
    			17,
    			-41
    		],
    		[
    			-2,
    			-32
    		],
    		[
    			-23,
    			-6
    		],
    		[
    			-63,
    			-48
    		],
    		[
    			-47,
    			-20
    		],
    		[
    			-58,
    			-11
    		],
    		[
    			-14,
    			-13
    		],
    		[
    			-12,
    			-50
    		],
    		[
    			-70,
    			-63
    		],
    		[
    			10,
    			-49
    		],
    		[
    			-19,
    			-12
    		],
    		[
    			-2,
    			-121
    		],
    		[
    			-18,
    			-5
    		],
    		[
    			-19,
    			-104
    		],
    		[
    			-24,
    			-11
    		],
    		[
    			-49,
    			-50
    		],
    		[
    			-8,
    			-21
    		],
    		[
    			-60,
    			-11
    		],
    		[
    			4,
    			-51
    		],
    		[
    			-23,
    			-23
    		],
    		[
    			27,
    			-31
    		],
    		[
    			-16,
    			-83
    		],
    		[
    			-27,
    			-47
    		],
    		[
    			14,
    			-51
    		],
    		[
    			40,
    			-18
    		],
    		[
    			19,
    			4
    		],
    		[
    			37,
    			-23
    		],
    		[
    			10,
    			-86
    		],
    		[
    			-12,
    			-52
    		],
    		[
    			-46,
    			-33
    		],
    		[
    			-2,
    			-27
    		],
    		[
    			-59,
    			-11
    		],
    		[
    			-41,
    			16
    		],
    		[
    			-22,
    			-10
    		]
    	],
    	[
    		[
    			4124,
    			6827
    		],
    		[
    			-1482,
    			187
    		],
    		[
    			6,
    			74
    		],
    		[
    			-10,
    			39
    		],
    		[
    			-47,
    			34
    		],
    		[
    			13,
    			80
    		],
    		[
    			-7,
    			31
    		],
    		[
    			24,
    			22
    		],
    		[
    			5,
    			111
    		],
    		[
    			-10,
    			91
    		],
    		[
    			-46,
    			130
    		],
    		[
    			-25,
    			58
    		],
    		[
    			-45,
    			54
    		],
    		[
    			-10,
    			32
    		],
    		[
    			-28,
    			39
    		],
    		[
    			-21,
    			3
    		],
    		[
    			-28,
    			73
    		],
    		[
    			-46,
    			53
    		],
    		[
    			-28,
    			19
    		],
    		[
    			-35,
    			47
    		],
    		[
    			-39,
    			72
    		],
    		[
    			-41,
    			37
    		],
    		[
    			-30,
    			-25
    		],
    		[
    			-52,
    			-1
    		],
    		[
    			-49,
    			42
    		],
    		[
    			-22,
    			32
    		],
    		[
    			33,
    			41
    		],
    		[
    			-15,
    			101
    		],
    		[
    			-28,
    			66
    		],
    		[
    			-27,
    			18
    		],
    		[
    			-98,
    			18
    		],
    		[
    			-49,
    			-13
    		],
    		[
    			-18,
    			30
    		],
    		[
    			-52,
    			23
    		],
    		[
    			-77,
    			66
    		],
    		[
    			-25,
    			8
    		],
    		[
    			-44,
    			48
    		],
    		[
    			-15,
    			103
    		],
    		[
    			-56,
    			56
    		],
    		[
    			-31,
    			54
    		],
    		[
    			-53,
    			48
    		],
    		[
    			-63,
    			18
    		],
    		[
    			-37,
    			-6
    		],
    		[
    			-34,
    			27
    		],
    		[
    			-51,
    			5
    		],
    		[
    			-67,
    			62
    		],
    		[
    			-62,
    			25
    		],
    		[
    			-97,
    			25
    		],
    		[
    			-114,
    			15
    		],
    		[
    			-9,
    			64
    		],
    		[
    			-67,
    			63
    		],
    		[
    			50,
    			91
    		],
    		[
    			-8,
    			53
    		],
    		[
    			28,
    			54
    		],
    		[
    			-23,
    			54
    		],
    		[
    			53,
    			116
    		],
    		[
    			9,
    			49
    		],
    		[
    			-28,
    			46
    		],
    		[
    			-49,
    			20
    		],
    		[
    			-35,
    			33
    		],
    		[
    			-15,
    			38
    		],
    		[
    			32,
    			56
    		],
    		[
    			13,
    			59
    		],
    		[
    			-13,
    			41
    		],
    		[
    			-53,
    			25
    		],
    		[
    			-39,
    			83
    		],
    		[
    			-21,
    			77
    		],
    		[
    			-48,
    			38
    		],
    		[
    			-22,
    			46
    		],
    		[
    			4,
    			56
    		],
    		[
    			-32,
    			69
    		],
    		[
    			-23,
    			34
    		],
    		[
    			4,
    			66
    		],
    		[
    			-8,
    			32
    		],
    		[
    			-32,
    			24
    		],
    		[
    			-15,
    			81
    		],
    		[
    			-32,
    			73
    		],
    		[
    			-54,
    			55
    		],
    		[
    			-28,
    			62
    		],
    		[
    			11,
    			23
    		],
    		[
    			5,
    			96
    		],
    		[
    			-5,
    			28
    		],
    		[
    			21,
    			50
    		],
    		[
    			-21,
    			21
    		],
    		[
    			32,
    			37
    		],
    		[
    			33,
    			-34
    		],
    		[
    			36,
    			33
    		],
    		[
    			50,
    			105
    		],
    		[
    			-16,
    			110
    		],
    		[
    			-29,
    			47
    		],
    		[
    			-29,
    			-11
    		],
    		[
    			-54,
    			11
    		],
    		[
    			-43,
    			37
    		],
    		[
    			-29,
    			49
    		],
    		[
    			-19,
    			68
    		],
    		[
    			-23,
    			16
    		],
    		[
    			-9,
    			52
    		],
    		[
    			-17,
    			24
    		],
    		[
    			4,
    			42
    		],
    		[
    			32,
    			82
    		],
    		[
    			-8,
    			65
    		],
    		[
    			2,
    			46
    		],
    		[
    			-26,
    			32
    		],
    		[
    			45,
    			122
    		],
    		[
    			10,
    			75
    		],
    		[
    			65,
    			5
    		],
    		[
    			12,
    			-71
    		],
    		[
    			-25,
    			-10
    		],
    		[
    			-5,
    			-93
    		],
    		[
    			51,
    			-31
    		],
    		[
    			29,
    			-43
    		],
    		[
    			30,
    			-63
    		],
    		[
    			29,
    			-25
    		],
    		[
    			11,
    			36
    		],
    		[
    			-29,
    			13
    		],
    		[
    			-3,
    			73
    		],
    		[
    			7,
    			41
    		],
    		[
    			-7,
    			44
    		],
    		[
    			-31,
    			37
    		],
    		[
    			-6,
    			38
    		],
    		[
    			-27,
    			19
    		],
    		[
    			32,
    			51
    		],
    		[
    			-2,
    			42
    		],
    		[
    			-36,
    			14
    		],
    		[
    			-2,
    			45
    		],
    		[
    			84,
    			23
    		],
    		[
    			17,
    			19
    		],
    		[
    			-11,
    			46
    		],
    		[
    			-42,
    			46
    		],
    		[
    			-56,
    			-8
    		],
    		[
    			-27,
    			-69
    		],
    		[
    			16,
    			-18
    		],
    		[
    			-23,
    			-25
    		],
    		[
    			-7,
    			-33
    		],
    		[
    			18,
    			-40
    		],
    		[
    			-46,
    			-36
    		],
    		[
    			-24,
    			21
    		],
    		[
    			-39,
    			63
    		],
    		[
    			-34,
    			7
    		],
    		[
    			-34,
    			55
    		],
    		[
    			-11,
    			44
    		],
    		[
    			-28,
    			32
    		],
    		[
    			-30,
    			15
    		],
    		[
    			-46,
    			-10
    		],
    		[
    			51,
    			75
    		],
    		[
    			17,
    			37
    		],
    		[
    			-7,
    			44
    		],
    		[
    			14,
    			26
    		],
    		[
    			-10,
    			40
    		],
    		[
    			-33,
    			32
    		],
    		[
    			11,
    			27
    		],
    		[
    			-14,
    			79
    		],
    		[
    			-91,
    			129
    		],
    		[
    			-28,
    			115
    		],
    		[
    			-31,
    			44
    		],
    		[
    			-8,
    			32
    		],
    		[
    			-43,
    			70
    		],
    		[
    			-19,
    			64
    		],
    		[
    			-2,
    			35
    		],
    		[
    			35,
    			42
    		],
    		[
    			6,
    			22
    		],
    		[
    			-1,
    			93
    		],
    		[
    			-12,
    			30
    		],
    		[
    			6,
    			34
    		],
    		[
    			-3,
    			93
    		],
    		[
    			27,
    			71
    		],
    		[
    			50,
    			73
    		],
    		[
    			-2,
    			40
    		],
    		[
    			16,
    			69
    		],
    		[
    			-11,
    			27
    		],
    		[
    			10,
    			93
    		],
    		[
    			-23,
    			31
    		],
    		[
    			-2,
    			39
    		],
    		[
    			-35,
    			97
    		],
    		[
    			-19,
    			22
    		],
    		[
    			-1,
    			59
    		],
    		[
    			-36,
    			34
    		],
    		[
    			-65,
    			130
    		],
    		[
    			20,
    			37
    		],
    		[
    			3,
    			64
    		],
    		[
    			-7,
    			44
    		],
    		[
    			25,
    			43
    		],
    		[
    			55,
    			75
    		],
    		[
    			147,
    			166
    		],
    		[
    			57,
    			106
    		],
    		[
    			-15,
    			44
    		],
    		[
    			24,
    			51
    		],
    		[
    			37,
    			58
    		],
    		[
    			69,
    			151
    		],
    		[
    			13,
    			85
    		],
    		[
    			-4,
    			92
    		],
    		[
    			2,
    			68
    		],
    		[
    			-39,
    			44
    		],
    		[
    			34,
    			46
    		],
    		[
    			29,
    			68
    		],
    		[
    			8,
    			45
    		]
    	],
    	[
    		[
    			20483,
    			3869
    		],
    		[
    			64,
    			18
    		],
    		[
    			52,
    			12
    		],
    		[
    			9,
    			24
    		],
    		[
    			34,
    			-24
    		],
    		[
    			-80,
    			-9
    		],
    		[
    			-79,
    			-21
    		]
    	],
    	[
    		[
    			20275,
    			7619
    		],
    		[
    			-3,
    			9
    		],
    		[
    			322,
    			26
    		],
    		[
    			141,
    			13
    		],
    		[
    			339,
    			25
    		],
    		[
    			619,
    			64
    		],
    		[
    			131,
    			13
    		]
    	],
    	[
    		[
    			21824,
    			7769
    		],
    		[
    			45,
    			-182
    		],
    		[
    			89,
    			-325
    		],
    		[
    			116,
    			-445
    		],
    		[
    			179,
    			-684
    		],
    		[
    			34,
    			-76
    		],
    		[
    			33,
    			-88
    		],
    		[
    			29,
    			-48
    		],
    		[
    			46,
    			-46
    		],
    		[
    			10,
    			-49
    		],
    		[
    			14,
    			-5
    		],
    		[
    			-8,
    			-96
    		],
    		[
    			44,
    			-14
    		],
    		[
    			23,
    			-29
    		],
    		[
    			-14,
    			-32
    		],
    		[
    			-45,
    			-36
    		],
    		[
    			-29,
    			-42
    		],
    		[
    			14,
    			-35
    		],
    		[
    			1,
    			-60
    		],
    		[
    			-40,
    			-125
    		],
    		[
    			24,
    			-97
    		],
    		[
    			-1,
    			-30
    		],
    		[
    			48,
    			-55
    		],
    		[
    			17,
    			-59
    		],
    		[
    			-13,
    			-59
    		],
    		[
    			-4,
    			-83
    		],
    		[
    			8,
    			-54
    		],
    		[
    			-12,
    			-26
    		],
    		[
    			13,
    			-29
    		],
    		[
    			3,
    			-47
    		],
    		[
    			45,
    			-40
    		],
    		[
    			30,
    			-81
    		]
    	],
    	[
    		[
    			20992,
    			3956
    		],
    		[
    			-85,
    			-33
    		],
    		[
    			-114,
    			-28
    		],
    		[
    			-82,
    			-1
    		],
    		[
    			18,
    			22
    		],
    		[
    			28,
    			-15
    		],
    		[
    			78,
    			26
    		],
    		[
    			6,
    			23
    		],
    		[
    			-36,
    			29
    		],
    		[
    			-21,
    			33
    		],
    		[
    			-46,
    			21
    		],
    		[
    			-24,
    			56
    		],
    		[
    			17,
    			45
    		],
    		[
    			-20,
    			86
    		],
    		[
    			-53,
    			21
    		],
    		[
    			-41,
    			-90
    		],
    		[
    			-8,
    			-50
    		],
    		[
    			4,
    			-104
    		],
    		[
    			-17,
    			-52
    		],
    		[
    			-33,
    			0
    		],
    		[
    			1,
    			36
    		],
    		[
    			-73,
    			12
    		],
    		[
    			-26,
    			13
    		],
    		[
    			-34,
    			-31
    		]
    	],
    	[
    		[
    			21824,
    			7769
    		],
    		[
    			132,
    			14
    		],
    		[
    			265,
    			36
    		],
    		[
    			367,
    			48
    		]
    	],
    	[
    		[
    			23308,
    			7976
    		],
    		[
    			-13,
    			-62
    		],
    		[
    			-94,
    			-122
    		],
    		[
    			-11,
    			-50
    		],
    		[
    			13,
    			-31
    		],
    		[
    			71,
    			-50
    		],
    		[
    			31,
    			2
    		],
    		[
    			71,
    			-69
    		],
    		[
    			48,
    			-22
    		],
    		[
    			60,
    			20
    		],
    		[
    			31,
    			-29
    		],
    		[
    			21,
    			-60
    		],
    		[
    			27,
    			-16
    		],
    		[
    			36,
    			-54
    		],
    		[
    			29,
    			-88
    		],
    		[
    			26,
    			-11
    		],
    		[
    			29,
    			-47
    		],
    		[
    			30,
    			-24
    		],
    		[
    			33,
    			-63
    		],
    		[
    			89,
    			-52
    		],
    		[
    			49,
    			-16
    		],
    		[
    			63,
    			-50
    		],
    		[
    			49,
    			-95
    		],
    		[
    			43,
    			-25
    		],
    		[
    			55,
    			-13
    		],
    		[
    			45,
    			-54
    		],
    		[
    			39,
    			-13
    		],
    		[
    			6,
    			-65
    		],
    		[
    			21,
    			-41
    		],
    		[
    			34,
    			-6
    		],
    		[
    			7,
    			-45
    		],
    		[
    			42,
    			-28
    		],
    		[
    			22,
    			-36
    		],
    		[
    			40,
    			-28
    		],
    		[
    			55,
    			-8
    		],
    		[
    			40,
    			-33
    		],
    		[
    			47,
    			-23
    		],
    		[
    			1,
    			-54
    		],
    		[
    			38,
    			-66
    		],
    		[
    			23,
    			-7
    		],
    		[
    			11,
    			-43
    		],
    		[
    			0,
    			-61
    		],
    		[
    			26,
    			-38
    		],
    		[
    			-7,
    			-26
    		],
    		[
    			40,
    			-31
    		],
    		[
    			37,
    			-6
    		],
    		[
    			70,
    			-58
    		],
    		[
    			2,
    			-35
    		],
    		[
    			35,
    			-53
    		],
    		[
    			22,
    			-7
    		],
    		[
    			11,
    			-38
    		],
    		[
    			-17,
    			-36
    		],
    		[
    			25,
    			-31
    		],
    		[
    			9,
    			-52
    		],
    		[
    			38,
    			-28
    		],
    		[
    			36,
    			14
    		],
    		[
    			62,
    			-40
    		],
    		[
    			20,
    			1
    		]
    	],
    	[
    		[
    			24974,
    			5874
    		],
    		[
    			31,
    			-13
    		],
    		[
    			-20,
    			-47
    		],
    		[
    			-32,
    			-1
    		],
    		[
    			-28,
    			-29
    		],
    		[
    			36,
    			-13
    		],
    		[
    			-32,
    			-46
    		],
    		[
    			-33,
    			10
    		],
    		[
    			-15,
    			-41
    		],
    		[
    			26,
    			-10
    		],
    		[
    			-48,
    			-78
    		],
    		[
    			12,
    			-71
    		],
    		[
    			-19,
    			-60
    		],
    		[
    			-50,
    			-11
    		],
    		[
    			0,
    			-22
    		],
    		[
    			52,
    			-2
    		],
    		[
    			-56,
    			-126
    		],
    		[
    			26,
    			-77
    		],
    		[
    			-6,
    			-40
    		],
    		[
    			-23,
    			-20
    		],
    		[
    			-16,
    			-42
    		],
    		[
    			-24,
    			-26
    		],
    		[
    			10,
    			-36
    		],
    		[
    			-5,
    			-45
    		],
    		[
    			-41,
    			-32
    		],
    		[
    			58,
    			-12
    		],
    		[
    			5,
    			-42
    		],
    		[
    			-16,
    			-77
    		],
    		[
    			0,
    			-55
    		],
    		[
    			13,
    			-23
    		]
    	],
    	[
    		[
    			24004,
    			13671
    		],
    		[
    			94,
    			64
    		],
    		[
    			85,
    			78
    		],
    		[
    			22,
    			50
    		],
    		[
    			24,
    			-18
    		],
    		[
    			90,
    			86
    		],
    		[
    			55,
    			41
    		]
    	],
    	[
    		[
    			24374,
    			13972
    		],
    		[
    			34,
    			-211
    		],
    		[
    			476,
    			89
    		],
    		[
    			149,
    			31
    		],
    		[
    			409,
    			82
    		],
    		[
    			378,
    			80
    		],
    		[
    			200,
    			45
    		],
    		[
    			217,
    			45
    		],
    		[
    			321,
    			73
    		],
    		[
    			203,
    			49
    		],
    		[
    			53,
    			-37
    		],
    		[
    			19,
    			-51
    		],
    		[
    			35,
    			7
    		],
    		[
    			49,
    			-9
    		],
    		[
    			20,
    			-21
    		],
    		[
    			-4,
    			-31
    		],
    		[
    			31,
    			-10
    		],
    		[
    			27,
    			-103
    		],
    		[
    			-14,
    			-13
    		],
    		[
    			64,
    			-65
    		],
    		[
    			6,
    			-20
    		],
    		[
    			40,
    			3
    		],
    		[
    			16,
    			-23
    		],
    		[
    			72,
    			5
    		],
    		[
    			45,
    			-43
    		]
    	],
    	[
    		[
    			27220,
    			13844
    		],
    		[
    			-29,
    			-16
    		],
    		[
    			-34,
    			-64
    		],
    		[
    			-8,
    			-80
    		],
    		[
    			-15,
    			-38
    		],
    		[
    			-27,
    			-31
    		],
    		[
    			-13,
    			-59
    		],
    		[
    			-48,
    			-51
    		],
    		[
    			13,
    			-27
    		],
    		[
    			47,
    			-53
    		],
    		[
    			-16,
    			-71
    		],
    		[
    			-32,
    			-19
    		],
    		[
    			-3,
    			-71
    		],
    		[
    			24,
    			-87
    		],
    		[
    			52,
    			5
    		],
    		[
    			21,
    			-15
    		],
    		[
    			26,
    			-95
    		],
    		[
    			55,
    			-5
    		],
    		[
    			19,
    			-38
    		],
    		[
    			49,
    			-27
    		],
    		[
    			22,
    			-31
    		],
    		[
    			44,
    			-18
    		],
    		[
    			37,
    			-47
    		],
    		[
    			-27,
    			-27
    		],
    		[
    			-20,
    			1
    		],
    		[
    			-17,
    			-39
    		],
    		[
    			-37,
    			-22
    		],
    		[
    			-63,
    			-89
    		],
    		[
    			-27,
    			-22
    		],
    		[
    			9,
    			-36
    		],
    		[
    			-69,
    			-67
    		],
    		[
    			-32,
    			-8
    		],
    		[
    			-39,
    			-47
    		]
    	],
    	[
    		[
    			27082,
    			12550
    		],
    		[
    			-5,
    			2
    		]
    	],
    	[
    		[
    			27077,
    			12552
    		],
    		[
    			-46,
    			11
    		],
    		[
    			-65,
    			-14
    		],
    		[
    			-41,
    			-35
    		],
    		[
    			-36,
    			-74
    		]
    	],
    	[
    		[
    			26889,
    			12440
    		],
    		[
    			-346,
    			-79
    		],
    		[
    			-315,
    			-70
    		],
    		[
    			-264,
    			-56
    		],
    		[
    			-591,
    			-119
    		],
    		[
    			-520,
    			-102
    		]
    	],
    	[
    		[
    			24165,
    			12626
    		],
    		[
    			-161,
    			1045
    		]
    	],
    	[
    		[
    			15734,
    			11839
    		],
    		[
    			431,
    			-5
    		],
    		[
    			279,
    			0
    		],
    		[
    			227,
    			6
    		],
    		[
    			296,
    			13
    		],
    		[
    			160,
    			5
    		],
    		[
    			279,
    			16
    		],
    		[
    			367,
    			25
    		],
    		[
    			203,
    			19
    		],
    		[
    			29,
    			-47
    		],
    		[
    			31,
    			-6
    		],
    		[
    			6,
    			-30
    		],
    		[
    			55,
    			-72
    		],
    		[
    			26,
    			-22
    		],
    		[
    			34,
    			-1
    		]
    	],
    	[
    		[
    			18157,
    			11740
    		],
    		[
    			-23,
    			-29
    		],
    		[
    			-21,
    			-85
    		],
    		[
    			2,
    			-86
    		],
    		[
    			12,
    			-72
    		],
    		[
    			45,
    			-94
    		],
    		[
    			-14,
    			-30
    		],
    		[
    			12,
    			-31
    		],
    		[
    			40,
    			-40
    		],
    		[
    			-3,
    			-42
    		],
    		[
    			77,
    			-77
    		],
    		[
    			32,
    			-18
    		],
    		[
    			23,
    			-46
    		],
    		[
    			27,
    			-4
    		],
    		[
    			26,
    			-54
    		],
    		[
    			39,
    			-34
    		],
    		[
    			90,
    			-61
    		],
    		[
    			67,
    			-66
    		],
    		[
    			14,
    			-76
    		],
    		[
    			18,
    			-52
    		],
    		[
    			-15,
    			-25
    		],
    		[
    			22,
    			-51
    		],
    		[
    			12,
    			-52
    		],
    		[
    			47,
    			-42
    		],
    		[
    			22,
    			7
    		],
    		[
    			49,
    			76
    		],
    		[
    			39,
    			-7
    		],
    		[
    			43,
    			-22
    		],
    		[
    			34,
    			-2
    		],
    		[
    			81,
    			-50
    		],
    		[
    			-3,
    			-41
    		],
    		[
    			-24,
    			-22
    		],
    		[
    			-23,
    			-50
    		],
    		[
    			19,
    			-35
    		],
    		[
    			-2,
    			-53
    		],
    		[
    			-36,
    			-58
    		],
    		[
    			-16,
    			-82
    		],
    		[
    			-29,
    			-41
    		],
    		[
    			-9,
    			-76
    		],
    		[
    			14,
    			-53
    		],
    		[
    			48,
    			-42
    		],
    		[
    			20,
    			-34
    		],
    		[
    			43,
    			-32
    		],
    		[
    			24,
    			-4
    		],
    		[
    			23,
    			-34
    		],
    		[
    			21,
    			-1
    		],
    		[
    			31,
    			-33
    		],
    		[
    			38,
    			2
    		],
    		[
    			-16,
    			-41
    		],
    		[
    			14,
    			-28
    		],
    		[
    			30,
    			-8
    		],
    		[
    			31,
    			30
    		],
    		[
    			30,
    			-34
    		],
    		[
    			33,
    			-8
    		],
    		[
    			75,
    			-72
    		],
    		[
    			22,
    			-27
    		],
    		[
    			42,
    			-19
    		],
    		[
    			-1,
    			-35
    		],
    		[
    			25,
    			-32
    		],
    		[
    			-21,
    			-13
    		],
    		[
    			2,
    			-39
    		],
    		[
    			62,
    			-105
    		],
    		[
    			-5,
    			-42
    		],
    		[
    			-32,
    			-13
    		],
    		[
    			-13,
    			-37
    		],
    		[
    			35,
    			-25
    		],
    		[
    			2,
    			-41
    		],
    		[
    			56,
    			-86
    		],
    		[
    			1,
    			-36
    		],
    		[
    			53,
    			-34
    		],
    		[
    			18,
    			20
    		],
    		[
    			35,
    			-1
    		],
    		[
    			6,
    			-24
    		],
    		[
    			34,
    			4
    		]
    	],
    	[
    		[
    			19611,
    			9140
    		],
    		[
    			20,
    			-12
    		],
    		[
    			-6,
    			-62
    		],
    		[
    			-31,
    			-66
    		],
    		[
    			9,
    			-37
    		],
    		[
    			-17,
    			-36
    		],
    		[
    			26,
    			-37
    		],
    		[
    			-20,
    			-32
    		],
    		[
    			-14,
    			-48
    		],
    		[
    			-18,
    			-5
    		],
    		[
    			-44,
    			50
    		],
    		[
    			-27,
    			-15
    		],
    		[
    			-19,
    			-94
    		]
    	],
    	[
    		[
    			19470,
    			8746
    		],
    		[
    			-25,
    			-35
    		],
    		[
    			-15,
    			31
    		]
    	],
    	[
    		[
    			19430,
    			8742
    		],
    		[
    			10,
    			26
    		],
    		[
    			-13,
    			33
    		],
    		[
    			-34,
    			4
    		],
    		[
    			-16,
    			-27
    		],
    		[
    			22,
    			-38
    		]
    	],
    	[
    		[
    			19399,
    			8740
    		],
    		[
    			10,
    			-13
    		],
    		[
    			-8,
    			-49
    		],
    		[
    			21,
    			-35
    		],
    		[
    			-11,
    			-28
    		],
    		[
    			-46,
    			-2
    		],
    		[
    			0,
    			-25
    		],
    		[
    			47,
    			-27
    		],
    		[
    			-29,
    			-27
    		],
    		[
    			-64,
    			6
    		],
    		[
    			3,
    			-22
    		],
    		[
    			53,
    			-39
    		],
    		[
    			10,
    			-34
    		],
    		[
    			-49,
    			-39
    		],
    		[
    			-1,
    			-39
    		],
    		[
    			-26,
    			-28
    		]
    	],
    	[
    		[
    			19309,
    			8339
    		],
    		[
    			-380,
    			-29
    		],
    		[
    			44,
    			97
    		],
    		[
    			26,
    			14
    		],
    		[
    			14,
    			44
    		],
    		[
    			44,
    			37
    		],
    		[
    			43,
    			63
    		],
    		[
    			-12,
    			14
    		],
    		[
    			8,
    			48
    		],
    		[
    			-43,
    			22
    		],
    		[
    			-15,
    			65
    		],
    		[
    			-734,
    			-43
    		],
    		[
    			-78,
    			-2
    		],
    		[
    			-477,
    			-23
    		],
    		[
    			-456,
    			-17
    		],
    		[
    			-579,
    			-14
    		],
    		[
    			-298,
    			-5
    		]
    	],
    	[
    		[
    			16411,
    			9005
    		],
    		[
    			-8,
    			613
    		],
    		[
    			-2,
    			352
    		],
    		[
    			-4,
    			319
    		],
    		[
    			0,
    			151
    		],
    		[
    			-4,
    			243
    		],
    		[
    			-45,
    			51
    		],
    		[
    			-28,
    			-12
    		],
    		[
    			-29,
    			31
    		],
    		[
    			-21,
    			1
    		],
    		[
    			-13,
    			46
    		],
    		[
    			-31,
    			25
    		],
    		[
    			-13,
    			67
    		],
    		[
    			-103,
    			116
    		],
    		[
    			-3,
    			32
    		],
    		[
    			29,
    			6
    		],
    		[
    			15,
    			67
    		],
    		[
    			33,
    			22
    		],
    		[
    			24,
    			77
    		],
    		[
    			21,
    			35
    		],
    		[
    			-31,
    			18
    		],
    		[
    			-10,
    			36
    		],
    		[
    			-33,
    			-4
    		],
    		[
    			-35,
    			-29
    		],
    		[
    			-70,
    			37
    		],
    		[
    			-58,
    			72
    		]
    	],
    	[
    		[
    			8415,
    			12695
    		],
    		[
    			438,
    			-63
    		],
    		[
    			343,
    			-45
    		],
    		[
    			643,
    			-80
    		],
    		[
    			129,
    			-19
    		],
    		[
    			268,
    			-30
    		],
    		[
    			481,
    			-50
    		],
    		[
    			99,
    			-7
    		],
    		[
    			343,
    			-32
    		]
    	],
    	[
    		[
    			12215,
    			11493
    		],
    		[
    			-59,
    			-1054
    		],
    		[
    			-30,
    			-493
    		],
    		[
    			-15,
    			-289
    		],
    		[
    			-33,
    			-543
    		]
    	],
    	[
    		[
    			8011,
    			9556
    		],
    		[
    			38,
    			295
    		],
    		[
    			18,
    			121
    		],
    		[
    			64,
    			498
    		],
    		[
    			1,
    			88
    		],
    		[
    			46,
    			349
    		],
    		[
    			46,
    			318
    		],
    		[
    			134,
    			1034
    		],
    		[
    			19,
    			136
    		],
    		[
    			38,
    			300
    		]
    	],
    	[
    		[
    			7440,
    			13650
    		],
    		[
    			-117,
    			-784
    		],
    		[
    			298,
    			-53
    		],
    		[
    			528,
    			-81
    		],
    		[
    			266,
    			-37
    		]
    	],
    	[
    		[
    			8011,
    			9556
    		],
    		[
    			-336,
    			50
    		],
    		[
    			-487,
    			77
    		],
    		[
    			-17,
    			8
    		],
    		[
    			-366,
    			58
    		],
    		[
    			-421,
    			75
    		],
    		[
    			-389,
    			71
    		],
    		[
    			-245,
    			46
    		],
    		[
    			-376,
    			74
    		],
    		[
    			-246,
    			50
    		]
    	],
    	[
    		[
    			5128,
    			10065
    		],
    		[
    			82,
    			460
    		],
    		[
    			34,
    			180
    		],
    		[
    			94,
    			526
    		],
    		[
    			142,
    			777
    		],
    		[
    			127,
    			698
    		],
    		[
    			54,
    			290
    		],
    		[
    			157,
    			864
    		],
    		[
    			15,
    			85
    		]
    	],
    	[
    		[
    			19399,
    			8740
    		],
    		[
    			31,
    			2
    		]
    	],
    	[
    		[
    			19470,
    			8746
    		],
    		[
    			68,
    			12
    		],
    		[
    			108,
    			5
    		],
    		[
    			624,
    			47
    		],
    		[
    			9,
    			35
    		],
    		[
    			-31,
    			107
    		],
    		[
    			130,
    			0
    		],
    		[
    			0,
    			-24
    		],
    		[
    			256,
    			30
    		],
    		[
    			175,
    			18
    		],
    		[
    			306,
    			40
    		],
    		[
    			16,
    			-13
    		],
    		[
    			32,
    			18
    		],
    		[
    			102,
    			8
    		],
    		[
    			177,
    			5
    		],
    		[
    			117,
    			7
    		],
    		[
    			201,
    			18
    		],
    		[
    			170,
    			28
    		],
    		[
    			100,
    			8
    		],
    		[
    			107,
    			2
    		],
    		[
    			176,
    			15
    		],
    		[
    			324,
    			38
    		],
    		[
    			174,
    			18
    		],
    		[
    			7,
    			15
    		]
    	],
    	[
    		[
    			19014,
    			7523
    		],
    		[
    			8,
    			37
    		],
    		[
    			50,
    			-9
    		],
    		[
    			17,
    			74
    		],
    		[
    			44,
    			1
    		],
    		[
    			19,
    			17
    		],
    		[
    			-32,
    			39
    		],
    		[
    			21,
    			33
    		],
    		[
    			-14,
    			18
    		],
    		[
    			-36,
    			6
    		],
    		[
    			-4,
    			27
    		],
    		[
    			32,
    			9
    		],
    		[
    			-1,
    			30
    		],
    		[
    			18,
    			34
    		],
    		[
    			-35,
    			43
    		],
    		[
    			11,
    			29
    		],
    		[
    			34,
    			24
    		],
    		[
    			3,
    			34
    		],
    		[
    			30,
    			12
    		],
    		[
    			44,
    			48
    		],
    		[
    			-31,
    			56
    		],
    		[
    			1,
    			38
    		],
    		[
    			26,
    			18
    		],
    		[
    			20,
    			-12
    		],
    		[
    			34,
    			17
    		],
    		[
    			17,
    			37
    		],
    		[
    			44,
    			13
    		],
    		[
    			-36,
    			29
    		],
    		[
    			-3,
    			26
    		],
    		[
    			63,
    			32
    		],
    		[
    			-36,
    			27
    		],
    		[
    			-13,
    			29
    		]
    	],
    	[
    		[
    			7726,
    			15580
    		],
    		[
    			60,
    			406
    		],
    		[
    			136,
    			-23
    		],
    		[
    			43,
    			-15
    		],
    		[
    			134,
    			-20
    		],
    		[
    			20,
    			1
    		],
    		[
    			116,
    			-21
    		],
    		[
    			40,
    			-1
    		],
    		[
    			178,
    			-29
    		],
    		[
    			340,
    			-49
    		],
    		[
    			10,
    			-6
    		],
    		[
    			293,
    			-43
    		],
    		[
    			718,
    			-95
    		],
    		[
    			22,
    			-5
    		],
    		[
    			425,
    			-54
    		],
    		[
    			174,
    			-20
    		],
    		[
    			9,
    			5
    		],
    		[
    			281,
    			-31
    		],
    		[
    			449,
    			-47
    		],
    		[
    			233,
    			-22
    		]
    	],
    	[
    		[
    			27598,
    			13248
    		],
    		[
    			16,
    			46
    		],
    		[
    			-6,
    			56
    		],
    		[
    			59,
    			29
    		],
    		[
    			25,
    			-30
    		],
    		[
    			-22,
    			-52
    		],
    		[
    			-51,
    			-49
    		],
    		[
    			-21,
    			0
    		]
    	],
    	[
    		[
    			24374,
    			13972
    		],
    		[
    			39,
    			30
    		],
    		[
    			108,
    			111
    		],
    		[
    			20,
    			37
    		],
    		[
    			40,
    			47
    		],
    		[
    			84,
    			57
    		],
    		[
    			12,
    			50
    		],
    		[
    			21,
    			30
    		],
    		[
    			3,
    			37
    		],
    		[
    			62,
    			49
    		],
    		[
    			23,
    			33
    		],
    		[
    			-6,
    			54
    		],
    		[
    			-53,
    			82
    		],
    		[
    			-46,
    			14
    		],
    		[
    			-8,
    			63
    		],
    		[
    			-38,
    			3
    		],
    		[
    			9,
    			54
    		],
    		[
    			-22,
    			85
    		],
    		[
    			100,
    			66
    		],
    		[
    			108,
    			57
    		],
    		[
    			74,
    			29
    		],
    		[
    			164,
    			29
    		],
    		[
    			38,
    			12
    		],
    		[
    			166,
    			5
    		],
    		[
    			19,
    			5
    		],
    		[
    			110,
    			-56
    		],
    		[
    			39,
    			14
    		],
    		[
    			80,
    			42
    		],
    		[
    			41,
    			6
    		],
    		[
    			58,
    			22
    		],
    		[
    			59,
    			-3
    		],
    		[
    			47,
    			10
    		],
    		[
    			26,
    			26
    		],
    		[
    			54,
    			25
    		],
    		[
    			44,
    			38
    		],
    		[
    			23,
    			59
    		],
    		[
    			66,
    			64
    		],
    		[
    			33,
    			46
    		],
    		[
    			63,
    			7
    		],
    		[
    			27,
    			18
    		],
    		[
    			10,
    			39
    		],
    		[
    			-10,
    			69
    		],
    		[
    			-45,
    			113
    		],
    		[
    			-37,
    			24
    		],
    		[
    			31,
    			32
    		],
    		[
    			17,
    			-14
    		],
    		[
    			34,
    			34
    		],
    		[
    			-7,
    			27
    		],
    		[
    			-46,
    			35
    		],
    		[
    			33,
    			32
    		],
    		[
    			-14,
    			25
    		],
    		[
    			-53,
    			-61
    		],
    		[
    			-26,
    			39
    		],
    		[
    			-35,
    			14
    		],
    		[
    			-9,
    			20
    		],
    		[
    			15,
    			80
    		],
    		[
    			34,
    			11
    		],
    		[
    			36,
    			37
    		],
    		[
    			-5,
    			32
    		],
    		[
    			31,
    			22
    		],
    		[
    			42,
    			48
    		],
    		[
    			42,
    			26
    		],
    		[
    			38,
    			61
    		],
    		[
    			15,
    			71
    		],
    		[
    			184,
    			301
    		],
    		[
    			39,
    			42
    		],
    		[
    			37,
    			24
    		],
    		[
    			71,
    			87
    		],
    		[
    			33,
    			8
    		],
    		[
    			36,
    			35
    		],
    		[
    			53,
    			-8
    		],
    		[
    			22,
    			13
    		],
    		[
    			179,
    			38
    		],
    		[
    			96,
    			23
    		],
    		[
    			136,
    			42
    		],
    		[
    			119,
    			32
    		],
    		[
    			149,
    			45
    		]
    	],
    	[
    		[
    			27306,
    			16827
    		],
    		[
    			17,
    			-66
    		],
    		[
    			-8,
    			-66
    		],
    		[
    			31,
    			-25
    		],
    		[
    			-5,
    			-52
    		],
    		[
    			10,
    			-98
    		],
    		[
    			70,
    			-96
    		],
    		[
    			10,
    			-36
    		],
    		[
    			-9,
    			-48
    		],
    		[
    			29,
    			-72
    		],
    		[
    			-1,
    			-25
    		],
    		[
    			-25,
    			-51
    		],
    		[
    			1,
    			-117
    		],
    		[
    			17,
    			-10
    		],
    		[
    			17,
    			-71
    		],
    		[
    			28,
    			-41
    		],
    		[
    			-1,
    			-42
    		],
    		[
    			31,
    			-33
    		],
    		[
    			-16,
    			-116
    		],
    		[
    			8,
    			-38
    		],
    		[
    			19,
    			-9
    		],
    		[
    			10,
    			49
    		],
    		[
    			30,
    			7
    		],
    		[
    			46,
    			-68
    		],
    		[
    			41,
    			-205
    		],
    		[
    			63,
    			-330
    		],
    		[
    			0,
    			-26
    		],
    		[
    			23,
    			-39
    		]
    	],
    	[
    		[
    			27746,
    			14538
    		],
    		[
    			57,
    			-335
    		],
    		[
    			41,
    			-253
    		],
    		[
    			50,
    			-54
    		],
    		[
    			-112,
    			-120
    		],
    		[
    			55,
    			-59
    		],
    		[
    			3,
    			-20
    		]
    	],
    	[
    		[
    			27840,
    			13697
    		],
    		[
    			-7,
    			-32
    		],
    		[
    			-34,
    			-38
    		],
    		[
    			-19,
    			-58
    		],
    		[
    			33,
    			-3
    		],
    		[
    			17,
    			34
    		],
    		[
    			37,
    			-4
    		],
    		[
    			-2,
    			35
    		],
    		[
    			36,
    			25
    		],
    		[
    			40,
    			-23
    		],
    		[
    			-2,
    			57
    		],
    		[
    			29,
    			-2
    		],
    		[
    			20,
    			22
    		],
    		[
    			26,
    			-16
    		],
    		[
    			71,
    			1
    		],
    		[
    			38,
    			29
    		],
    		[
    			8,
    			42
    		],
    		[
    			40,
    			-1
    		],
    		[
    			147,
    			40
    		],
    		[
    			71,
    			33
    		],
    		[
    			72,
    			76
    		],
    		[
    			11,
    			31
    		],
    		[
    			24,
    			15
    		],
    		[
    			15,
    			39
    		],
    		[
    			29,
    			-34
    		],
    		[
    			39,
    			-27
    		],
    		[
    			40,
    			3
    		],
    		[
    			11,
    			20
    		],
    		[
    			47,
    			-38
    		],
    		[
    			32,
    			33
    		],
    		[
    			26,
    			48
    		],
    		[
    			27,
    			20
    		],
    		[
    			19,
    			-25
    		],
    		[
    			-111,
    			-93
    		],
    		[
    			-131,
    			-122
    		],
    		[
    			-36,
    			-29
    		],
    		[
    			-145,
    			-106
    		],
    		[
    			-117,
    			-97
    		],
    		[
    			-97,
    			-66
    		],
    		[
    			-51,
    			-21
    		],
    		[
    			-13,
    			7
    		],
    		[
    			-112,
    			-69
    		],
    		[
    			-84,
    			-22
    		],
    		[
    			-39,
    			-4
    		],
    		[
    			-82,
    			-60
    		],
    		[
    			-32,
    			15
    		],
    		[
    			-37,
    			35
    		],
    		[
    			8,
    			29
    		],
    		[
    			-12,
    			38
    		]
    	],
    	[
    		[
    			27690,
    			13434
    		],
    		[
    			-3,
    			38
    		],
    		[
    			23,
    			114
    		],
    		[
    			-4,
    			86
    		],
    		[
    			-244,
    			82
    		],
    		[
    			-242,
    			90
    		]
    	],
    	[
    		[
    			6161,
    			544
    		],
    		[
    			3,
    			68
    		],
    		[
    			24,
    			-12
    		],
    		[
    			15,
    			-55
    		],
    		[
    			-42,
    			-1
    		]
    	],
    	[
    		[
    			5864,
    			859
    		],
    		[
    			11,
    			32
    		],
    		[
    			42,
    			7
    		],
    		[
    			12,
    			-46
    		],
    		[
    			-29,
    			-21
    		],
    		[
    			-36,
    			28
    		]
    	],
    	[
    		[
    			5777,
    			718
    		],
    		[
    			30,
    			63
    		],
    		[
    			-18,
    			19
    		],
    		[
    			-7,
    			40
    		],
    		[
    			68,
    			7
    		],
    		[
    			52,
    			-67
    		],
    		[
    			35,
    			-14
    		],
    		[
    			52,
    			-47
    		],
    		[
    			11,
    			-31
    		],
    		[
    			47,
    			-34
    		],
    		[
    			-8,
    			-24
    		],
    		[
    			40,
    			-42
    		],
    		[
    			16,
    			2
    		],
    		[
    			36,
    			-131
    		],
    		[
    			-25,
    			-37
    		],
    		[
    			-53,
    			17
    		],
    		[
    			-49,
    			55
    		],
    		[
    			-32,
    			-3
    		],
    		[
    			4,
    			-33
    		],
    		[
    			32,
    			-23
    		],
    		[
    			-7,
    			-39
    		],
    		[
    			-85,
    			96
    		],
    		[
    			-10,
    			37
    		],
    		[
    			-32,
    			-6
    		],
    		[
    			-6,
    			27
    		],
    		[
    			44,
    			24
    		],
    		[
    			-20,
    			62
    		],
    		[
    			-35,
    			19
    		],
    		[
    			-6,
    			59
    		],
    		[
    			-41,
    			15
    		],
    		[
    			-33,
    			-11
    		]
    	],
    	[
    		[
    			5637,
    			949
    		],
    		[
    			6,
    			18
    		],
    		[
    			44,
    			18
    		],
    		[
    			-5,
    			29
    		],
    		[
    			18,
    			28
    		],
    		[
    			74,
    			-10
    		],
    		[
    			31,
    			9
    		],
    		[
    			33,
    			-13
    		],
    		[
    			88,
    			-85
    		],
    		[
    			-34,
    			-36
    		],
    		[
    			-157,
    			-54
    		],
    		[
    			18,
    			-31
    		],
    		[
    			-5,
    			-70
    		],
    		[
    			-40,
    			-16
    		],
    		[
    			-25,
    			79
    		],
    		[
    			19,
    			36
    		],
    		[
    			-56,
    			67
    		],
    		[
    			-9,
    			31
    		]
    	],
    	[
    		[
    			5473,
    			1371
    		],
    		[
    			26,
    			-9
    		],
    		[
    			24,
    			-43
    		],
    		[
    			21,
    			11
    		],
    		[
    			55,
    			-17
    		],
    		[
    			57,
    			-70
    		],
    		[
    			-21,
    			-1
    		],
    		[
    			-25,
    			36
    		],
    		[
    			-20,
    			-7
    		],
    		[
    			42,
    			-59
    		],
    		[
    			31,
    			-27
    		],
    		[
    			24,
    			-66
    		],
    		[
    			-79,
    			-121
    		],
    		[
    			-27,
    			56
    		],
    		[
    			18,
    			52
    		],
    		[
    			-21,
    			19
    		],
    		[
    			-37,
    			73
    		],
    		[
    			-1,
    			26
    		],
    		[
    			-28,
    			76
    		],
    		[
    			-39,
    			71
    		]
    	],
    	[
    		[
    			5424,
    			1060
    		],
    		[
    			18,
    			29
    		],
    		[
    			7,
    			34
    		],
    		[
    			72,
    			-28
    		],
    		[
    			32,
    			-42
    		],
    		[
    			60,
    			-143
    		],
    		[
    			24,
    			-141
    		],
    		[
    			-41,
    			15
    		],
    		[
    			-38,
    			68
    		],
    		[
    			-46,
    			37
    		],
    		[
    			-18,
    			30
    		],
    		[
    			7,
    			53
    		],
    		[
    			-21,
    			23
    		],
    		[
    			-2,
    			27
    		],
    		[
    			-54,
    			38
    		]
    	],
    	[
    		[
    			5405,
    			1015
    		],
    		[
    			-2,
    			33
    		],
    		[
    			34,
    			-4
    		],
    		[
    			17,
    			-30
    		],
    		[
    			-4,
    			-50
    		],
    		[
    			-45,
    			51
    		]
    	],
    	[
    		[
    			5264,
    			1228
    		],
    		[
    			3,
    			19
    		],
    		[
    			49,
    			48
    		],
    		[
    			19,
    			-6
    		],
    		[
    			23,
    			31
    		],
    		[
    			59,
    			-32
    		],
    		[
    			77,
    			-12
    		],
    		[
    			12,
    			-64
    		],
    		[
    			33,
    			-86
    		],
    		[
    			-24,
    			-19
    		],
    		[
    			-89,
    			45
    		],
    		[
    			9,
    			-71
    		],
    		[
    			-35,
    			-16
    		],
    		[
    			-44,
    			40
    		],
    		[
    			-21,
    			6
    		],
    		[
    			-31,
    			64
    		],
    		[
    			-35,
    			24
    		],
    		[
    			-5,
    			29
    		]
    	],
    	[
    		[
    			3797,
    			1764
    		],
    		[
    			15,
    			30
    		],
    		[
    			65,
    			-13
    		],
    		[
    			7,
    			-20
    		],
    		[
    			-60,
    			-10
    		],
    		[
    			-27,
    			13
    		]
    	],
    	[
    		[
    			3637,
    			1588
    		],
    		[
    			32,
    			62
    		],
    		[
    			34,
    			29
    		],
    		[
    			30,
    			42
    		],
    		[
    			0,
    			32
    		],
    		[
    			28,
    			0
    		],
    		[
    			5,
    			-28
    		],
    		[
    			-31,
    			-29
    		],
    		[
    			-40,
    			-63
    		],
    		[
    			8,
    			-20
    		],
    		[
    			-66,
    			-25
    		]
    	],
    	[
    		[
    			3631,
    			1724
    		],
    		[
    			20,
    			57
    		],
    		[
    			27,
    			-23
    		],
    		[
    			-17,
    			-32
    		],
    		[
    			-30,
    			-2
    		]
    	],
    	[
    		[
    			2848,
    			1117
    		],
    		[
    			58,
    			67
    		],
    		[
    			18,
    			-8
    		],
    		[
    			42,
    			55
    		],
    		[
    			4,
    			31
    		],
    		[
    			43,
    			11
    		],
    		[
    			-26,
    			-82
    		],
    		[
    			39,
    			6
    		],
    		[
    			34,
    			-38
    		],
    		[
    			-19,
    			-30
    		],
    		[
    			-70,
    			-6
    		],
    		[
    			-49,
    			-39
    		],
    		[
    			-74,
    			33
    		]
    	],
    	[
    		[
    			2672,
    			689
    		],
    		[
    			42,
    			18
    		],
    		[
    			18,
    			-36
    		],
    		[
    			-42,
    			1
    		],
    		[
    			-18,
    			17
    		]
    	],
    	[
    		[
    			2630,
    			929
    		],
    		[
    			29,
    			45
    		],
    		[
    			63,
    			38
    		],
    		[
    			35,
    			-7
    		],
    		[
    			11,
    			45
    		],
    		[
    			31,
    			22
    		],
    		[
    			32,
    			-37
    		],
    		[
    			29,
    			36
    		],
    		[
    			37,
    			12
    		],
    		[
    			36,
    			-16
    		],
    		[
    			56,
    			2
    		],
    		[
    			12,
    			-34
    		],
    		[
    			-22,
    			-15
    		],
    		[
    			20,
    			-40
    		],
    		[
    			-8,
    			-62
    		],
    		[
    			-29,
    			10
    		],
    		[
    			-16,
    			-36
    		],
    		[
    			-46,
    			-14
    		],
    		[
    			1,
    			-40
    		],
    		[
    			-44,
    			-10
    		],
    		[
    			-6,
    			-21
    		],
    		[
    			-45,
    			3
    		],
    		[
    			-71,
    			-69
    		],
    		[
    			-75,
    			81
    		],
    		[
    			4,
    			55
    		],
    		[
    			-34,
    			52
    		]
    	],
    	[
    		[
    			1711,
    			354
    		],
    		[
    			25,
    			27
    		],
    		[
    			-4,
    			28
    		],
    		[
    			30,
    			24
    		],
    		[
    			7,
    			-41
    		],
    		[
    			-58,
    			-38
    		]
    	],
    	[
    		[
    			1640,
    			493
    		],
    		[
    			25,
    			20
    		],
    		[
    			24,
    			-10
    		],
    		[
    			-16,
    			-69
    		],
    		[
    			-36,
    			29
    		],
    		[
    			3,
    			30
    		]
    	],
    	[
    		[
    			1785,
    			1436
    		],
    		[
    			9,
    			30
    		],
    		[
    			42,
    			-1
    		],
    		[
    			-24,
    			-39
    		],
    		[
    			-27,
    			10
    		]
    	],
    	[
    		[
    			970,
    			437
    		],
    		[
    			41,
    			12
    		],
    		[
    			37,
    			48
    		],
    		[
    			37,
    			4
    		],
    		[
    			76,
    			21
    		],
    		[
    			54,
    			-20
    		],
    		[
    			12,
    			-22
    		],
    		[
    			-3,
    			-32
    		],
    		[
    			8,
    			-45
    		],
    		[
    			-51,
    			-13
    		],
    		[
    			-77,
    			23
    		],
    		[
    			-41,
    			-12
    		],
    		[
    			-28,
    			-29
    		],
    		[
    			-32,
    			-1
    		],
    		[
    			-28,
    			17
    		],
    		[
    			-5,
    			49
    		]
    	],
    	[
    		[
    			758,
    			362
    		],
    		[
    			27,
    			22
    		],
    		[
    			32,
    			-28
    		],
    		[
    			-24,
    			-25
    		],
    		[
    			-31,
    			6
    		],
    		[
    			-4,
    			25
    		]
    	],
    	[
    		[
    			1041,
    			2128
    		],
    		[
    			67,
    			-19
    		],
    		[
    			22,
    			12
    		],
    		[
    			88,
    			6
    		],
    		[
    			19,
    			-30
    		],
    		[
    			39,
    			-18
    		],
    		[
    			-19,
    			-63
    		],
    		[
    			5,
    			-50
    		],
    		[
    			-51,
    			6
    		],
    		[
    			-30,
    			-8
    		],
    		[
    			-59,
    			26
    		],
    		[
    			-29,
    			44
    		],
    		[
    			-24,
    			16
    		],
    		[
    			-28,
    			78
    		]
    	],
    	[
    		[
    			424,
    			223
    		],
    		[
    			30,
    			13
    		],
    		[
    			91,
    			-5
    		],
    		[
    			10,
    			37
    		],
    		[
    			34,
    			24
    		],
    		[
    			-13,
    			47
    		],
    		[
    			52,
    			23
    		],
    		[
    			36,
    			-3
    		],
    		[
    			-4,
    			-43
    		],
    		[
    			45,
    			-13
    		],
    		[
    			-8,
    			-55
    		],
    		[
    			-46,
    			-4
    		],
    		[
    			-27,
    			-33
    		],
    		[
    			-38,
    			-5
    		],
    		[
    			-26,
    			14
    		],
    		[
    			-49,
    			-19
    		],
    		[
    			-50,
    			2
    		],
    		[
    			-37,
    			20
    		]
    	],
    	[
    		[
    			1411,
    			3678
    		],
    		[
    			21,
    			16
    		],
    		[
    			76,
    			18
    		],
    		[
    			102,
    			45
    		],
    		[
    			123,
    			41
    		],
    		[
    			55,
    			12
    		],
    		[
    			87,
    			10
    		],
    		[
    			57,
    			-12
    		],
    		[
    			7,
    			-32
    		],
    		[
    			-18,
    			-19
    		],
    		[
    			-21,
    			-54
    		],
    		[
    			8,
    			-44
    		],
    		[
    			65,
    			-23
    		],
    		[
    			44,
    			1
    		],
    		[
    			37,
    			-30
    		],
    		[
    			29,
    			8
    		],
    		[
    			31,
    			-18
    		],
    		[
    			40,
    			50
    		],
    		[
    			56,
    			-26
    		],
    		[
    			-6,
    			45
    		],
    		[
    			-39,
    			26
    		],
    		[
    			-42,
    			-4
    		],
    		[
    			12,
    			38
    		],
    		[
    			-28,
    			74
    		],
    		[
    			-21,
    			11
    		],
    		[
    			-3,
    			51
    		],
    		[
    			33,
    			4
    		],
    		[
    			20,
    			-57
    		],
    		[
    			-13,
    			-33
    		],
    		[
    			10,
    			-29
    		],
    		[
    			31,
    			-42
    		],
    		[
    			14,
    			23
    		],
    		[
    			-31,
    			65
    		],
    		[
    			19,
    			45
    		],
    		[
    			20,
    			17
    		],
    		[
    			-18,
    			32
    		],
    		[
    			-70,
    			-5
    		],
    		[
    			-22,
    			27
    		],
    		[
    			-31,
    			4
    		],
    		[
    			-59,
    			34
    		],
    		[
    			0,
    			93
    		],
    		[
    			-18,
    			73
    		],
    		[
    			-28,
    			36
    		],
    		[
    			-59,
    			107
    		],
    		[
    			-46,
    			40
    		],
    		[
    			-23,
    			57
    		],
    		[
    			-29,
    			27
    		],
    		[
    			51,
    			53
    		],
    		[
    			24,
    			89
    		],
    		[
    			61,
    			-26
    		],
    		[
    			135,
    			-13
    		],
    		[
    			74,
    			39
    		],
    		[
    			44,
    			46
    		],
    		[
    			28,
    			88
    		],
    		[
    			21,
    			44
    		],
    		[
    			87,
    			96
    		],
    		[
    			49,
    			29
    		],
    		[
    			37,
    			-18
    		],
    		[
    			37,
    			1
    		],
    		[
    			53,
    			25
    		],
    		[
    			97,
    			83
    		],
    		[
    			57,
    			-20
    		],
    		[
    			89,
    			5
    		],
    		[
    			25,
    			9
    		],
    		[
    			49,
    			38
    		],
    		[
    			51,
    			67
    		],
    		[
    			25,
    			-1
    		],
    		[
    			47,
    			-38
    		],
    		[
    			33,
    			-12
    		],
    		[
    			-1,
    			-29
    		],
    		[
    			-43,
    			-23
    		],
    		[
    			6,
    			-40
    		],
    		[
    			35,
    			3
    		],
    		[
    			1,
    			25
    		],
    		[
    			25,
    			19
    		],
    		[
    			21,
    			37
    		],
    		[
    			40,
    			-52
    		],
    		[
    			-6,
    			-45
    		],
    		[
    			34,
    			-22
    		],
    		[
    			24,
    			29
    		],
    		[
    			63,
    			6
    		],
    		[
    			59,
    			-15
    		],
    		[
    			31,
    			-19
    		],
    		[
    			-25,
    			-37
    		],
    		[
    			4,
    			-35
    		],
    		[
    			61,
    			-13
    		],
    		[
    			13,
    			-31
    		],
    		[
    			39,
    			-20
    		],
    		[
    			19,
    			23
    		],
    		[
    			39,
    			5
    		],
    		[
    			14,
    			-22
    		],
    		[
    			47,
    			28
    		],
    		[
    			36,
    			1
    		],
    		[
    			46,
    			-28
    		],
    		[
    			34,
    			-8
    		],
    		[
    			9,
    			-26
    		],
    		[
    			41,
    			4
    		],
    		[
    			34,
    			-35
    		],
    		[
    			47,
    			-14
    		],
    		[
    			30,
    			8
    		],
    		[
    			92,
    			-3
    		],
    		[
    			40,
    			-35
    		],
    		[
    			50,
    			-19
    		],
    		[
    			104,
    			53
    		],
    		[
    			46,
    			12
    		],
    		[
    			49,
    			-27
    		],
    		[
    			132,
    			-88
    		],
    		[
    			44,
    			-12
    		],
    		[
    			275,
    			-2725
    		],
    		[
    			67,
    			-17
    		],
    		[
    			6,
    			26
    		],
    		[
    			68,
    			-28
    		],
    		[
    			33,
    			50
    		],
    		[
    			82,
    			16
    		],
    		[
    			-7,
    			-79
    		],
    		[
    			23,
    			-24
    		],
    		[
    			50,
    			-19
    		],
    		[
    			16,
    			-38
    		],
    		[
    			161,
    			-130
    		],
    		[
    			37,
    			-92
    		],
    		[
    			74,
    			87
    		],
    		[
    			33,
    			8
    		],
    		[
    			10,
    			37
    		],
    		[
    			-10,
    			53
    		],
    		[
    			24,
    			4
    		],
    		[
    			6,
    			53
    		],
    		[
    			32,
    			13
    		],
    		[
    			56,
    			52
    		],
    		[
    			73,
    			-55
    		],
    		[
    			-2,
    			-41
    		],
    		[
    			27,
    			-38
    		],
    		[
    			37,
    			-1
    		],
    		[
    			36,
    			-27
    		],
    		[
    			19,
    			-42
    		],
    		[
    			28,
    			-29
    		],
    		[
    			65,
    			-24
    		],
    		[
    			25,
    			-29
    		],
    		[
    			57,
    			-41
    		],
    		[
    			-9,
    			-15
    		],
    		[
    			54,
    			-58
    		],
    		[
    			23,
    			-40
    		],
    		[
    			39,
    			-37
    		],
    		[
    			67,
    			-87
    		],
    		[
    			62,
    			-70
    		],
    		[
    			-9,
    			-38
    		],
    		[
    			49,
    			-1
    		],
    		[
    			0,
    			-52
    		],
    		[
    			41,
    			-9
    		],
    		[
    			19,
    			-57
    		],
    		[
    			37,
    			14
    		],
    		[
    			86,
    			-39
    		],
    		[
    			47,
    			2
    		],
    		[
    			55,
    			-21
    		],
    		[
    			13,
    			-27
    		],
    		[
    			49,
    			9
    		],
    		[
    			28,
    			-56
    		],
    		[
    			-9,
    			-47
    		],
    		[
    			17,
    			-50
    		],
    		[
    			46,
    			-77
    		],
    		[
    			-13,
    			-31
    		],
    		[
    			-16,
    			-88
    		],
    		[
    			-44,
    			-68
    		],
    		[
    			-37,
    			9
    		],
    		[
    			-30,
    			77
    		],
    		[
    			-22,
    			26
    		],
    		[
    			-84,
    			13
    		],
    		[
    			-13,
    			-59
    		],
    		[
    			-29,
    			49
    		],
    		[
    			-3,
    			38
    		],
    		[
    			15,
    			46
    		],
    		[
    			-19,
    			37
    		],
    		[
    			-21,
    			-74
    		],
    		[
    			-37,
    			17
    		],
    		[
    			-14,
    			30
    		],
    		[
    			16,
    			37
    		],
    		[
    			-14,
    			93
    		],
    		[
    			-26,
    			-22
    		],
    		[
    			22,
    			-36
    		],
    		[
    			-33,
    			-13
    		],
    		[
    			-17,
    			23
    		],
    		[
    			-50,
    			25
    		],
    		[
    			16,
    			62
    		],
    		[
    			25,
    			24
    		],
    		[
    			-18,
    			55
    		],
    		[
    			-31,
    			2
    		],
    		[
    			-2,
    			35
    		],
    		[
    			-44,
    			18
    		],
    		[
    			-34,
    			52
    		],
    		[
    			-58,
    			3
    		],
    		[
    			-32,
    			13
    		],
    		[
    			-3,
    			53
    		],
    		[
    			-21,
    			52
    		],
    		[
    			-27,
    			19
    		],
    		[
    			-3,
    			23
    		],
    		[
    			-40,
    			58
    		],
    		[
    			-37,
    			33
    		],
    		[
    			-12,
    			32
    		],
    		[
    			-73,
    			-4
    		],
    		[
    			-18,
    			17
    		],
    		[
    			-26,
    			54
    		],
    		[
    			-27,
    			29
    		],
    		[
    			-4,
    			24
    		],
    		[
    			-34,
    			32
    		],
    		[
    			-23,
    			68
    		],
    		[
    			-33,
    			27
    		],
    		[
    			12,
    			-62
    		],
    		[
    			55,
    			-94
    		],
    		[
    			30,
    			-88
    		],
    		[
    			4,
    			-30
    		],
    		[
    			-38,
    			6
    		],
    		[
    			-52,
    			42
    		],
    		[
    			-39,
    			-10
    		],
    		[
    			-17,
    			16
    		],
    		[
    			3,
    			45
    		],
    		[
    			-40,
    			35
    		],
    		[
    			-12,
    			-9
    		],
    		[
    			-50,
    			16
    		],
    		[
    			75,
    			-70
    		],
    		[
    			20,
    			-44
    		],
    		[
    			-11,
    			-17
    		],
    		[
    			-56,
    			-30
    		],
    		[
    			-50,
    			21
    		],
    		[
    			-39,
    			5
    		],
    		[
    			-82,
    			45
    		],
    		[
    			-42,
    			41
    		],
    		[
    			-6,
    			28
    		],
    		[
    			-47,
    			38
    		],
    		[
    			-55,
    			17
    		],
    		[
    			-42,
    			27
    		],
    		[
    			-64,
    			23
    		],
    		[
    			-78,
    			43
    		],
    		[
    			31,
    			39
    		],
    		[
    			2,
    			28
    		],
    		[
    			-35,
    			21
    		],
    		[
    			-68,
    			-48
    		],
    		[
    			-80,
    			4
    		],
    		[
    			-80,
    			34
    		],
    		[
    			-22,
    			20
    		],
    		[
    			-130,
    			23
    		],
    		[
    			-50,
    			-2
    		],
    		[
    			-96,
    			-23
    		],
    		[
    			-36,
    			-18
    		],
    		[
    			-59,
    			48
    		],
    		[
    			-59,
    			12
    		],
    		[
    			-6,
    			19
    		],
    		[
    			-59,
    			3
    		],
    		[
    			-65,
    			44
    		],
    		[
    			-3,
    			39
    		],
    		[
    			-19,
    			15
    		],
    		[
    			-55,
    			-7
    		],
    		[
    			-66,
    			87
    		],
    		[
    			-54,
    			13
    		],
    		[
    			-40,
    			-25
    		],
    		[
    			-23,
    			21
    		],
    		[
    			-63,
    			-67
    		],
    		[
    			6,
    			-50
    		],
    		[
    			16,
    			-38
    		],
    		[
    			-49,
    			-52
    		],
    		[
    			36,
    			-21
    		],
    		[
    			-18,
    			-48
    		],
    		[
    			-30,
    			23
    		],
    		[
    			-5,
    			-46
    		],
    		[
    			-59,
    			-6
    		],
    		[
    			-72,
    			22
    		],
    		[
    			-28,
    			-43
    		],
    		[
    			-29,
    			3
    		],
    		[
    			1,
    			-41
    		],
    		[
    			-36,
    			-18
    		],
    		[
    			-38,
    			-62
    		],
    		[
    			-24,
    			9
    		],
    		[
    			-79,
    			-45
    		],
    		[
    			-18,
    			-26
    		],
    		[
    			-37,
    			17
    		],
    		[
    			-45,
    			-24
    		],
    		[
    			-31,
    			29
    		],
    		[
    			17,
    			48
    		],
    		[
    			62,
    			32
    		],
    		[
    			34,
    			27
    		],
    		[
    			-60,
    			5
    		],
    		[
    			-29,
    			39
    		],
    		[
    			24,
    			68
    		],
    		[
    			48,
    			67
    		],
    		[
    			21,
    			87
    		],
    		[
    			-16,
    			51
    		],
    		[
    			53,
    			24
    		],
    		[
    			84,
    			63
    		],
    		[
    			25,
    			-41
    		],
    		[
    			23,
    			-6
    		],
    		[
    			38,
    			39
    		],
    		[
    			-42,
    			40
    		],
    		[
    			47,
    			63
    		],
    		[
    			-21,
    			4
    		],
    		[
    			-14,
    			-42
    		],
    		[
    			-63,
    			4
    		],
    		[
    			-11,
    			15
    		],
    		[
    			-64,
    			-33
    		],
    		[
    			-19,
    			-36
    		],
    		[
    			-43,
    			-7
    		],
    		[
    			-39,
    			-38
    		],
    		[
    			-12,
    			-41
    		],
    		[
    			-58,
    			-53
    		],
    		[
    			-23,
    			-68
    		],
    		[
    			-52,
    			-28
    		],
    		[
    			24,
    			-36
    		],
    		[
    			-22,
    			-47
    		],
    		[
    			-40,
    			-27
    		],
    		[
    			-10,
    			-30
    		],
    		[
    			-77,
    			-38
    		],
    		[
    			-27,
    			-6
    		],
    		[
    			-52,
    			-61
    		],
    		[
    			-19,
    			-37
    		],
    		[
    			20,
    			-30
    		],
    		[
    			50,
    			-4
    		],
    		[
    			29,
    			-25
    		],
    		[
    			20,
    			-36
    		],
    		[
    			-19,
    			-48
    		],
    		[
    			-25,
    			-22
    		],
    		[
    			-43,
    			-3
    		],
    		[
    			-27,
    			-33
    		],
    		[
    			-18,
    			-43
    		],
    		[
    			-4,
    			-40
    		],
    		[
    			-40,
    			-11
    		],
    		[
    			-22,
    			-34
    		],
    		[
    			-21,
    			11
    		],
    		[
    			-60,
    			-24
    		],
    		[
    			3,
    			-22
    		],
    		[
    			-42,
    			-19
    		],
    		[
    			-38,
    			0
    		],
    		[
    			-24,
    			-48
    		],
    		[
    			-30,
    			-16
    		],
    		[
    			-16,
    			-28
    		],
    		[
    			-44,
    			3
    		],
    		[
    			-9,
    			-68
    		],
    		[
    			-33,
    			-37
    		],
    		[
    			-58,
    			-16
    		],
    		[
    			-43,
    			-45
    		],
    		[
    			-33,
    			26
    		],
    		[
    			-33,
    			-41
    		],
    		[
    			-57,
    			-10
    		],
    		[
    			0,
    			-49
    		],
    		[
    			-31,
    			17
    		],
    		[
    			-35,
    			-3
    		],
    		[
    			-31,
    			-27
    		],
    		[
    			38,
    			-38
    		],
    		[
    			-25,
    			-31
    		],
    		[
    			-16,
    			-40
    		],
    		[
    			-25,
    			16
    		],
    		[
    			-53,
    			-25
    		],
    		[
    			-68,
    			-2
    		],
    		[
    			-46,
    			-14
    		],
    		[
    			-26,
    			21
    		],
    		[
    			-35,
    			-12
    		],
    		[
    			-21,
    			-33
    		],
    		[
    			-43,
    			-9
    		],
    		[
    			-29,
    			-32
    		],
    		[
    			-72,
    			4
    		],
    		[
    			-42,
    			-16
    		],
    		[
    			-39,
    			10
    		],
    		[
    			32,
    			72
    		],
    		[
    			-35,
    			2
    		],
    		[
    			-23,
    			-55
    		],
    		[
    			-48,
    			-46
    		],
    		[
    			-26,
    			-36
    		],
    		[
    			-82,
    			4
    		],
    		[
    			-53,
    			-13
    		],
    		[
    			-18,
    			57
    		],
    		[
    			-28,
    			-17
    		],
    		[
    			23,
    			-31
    		],
    		[
    			-58,
    			-25
    		],
    		[
    			20,
    			41
    		],
    		[
    			4,
    			40
    		],
    		[
    			22,
    			12
    		],
    		[
    			51,
    			-7
    		],
    		[
    			19,
    			34
    		],
    		[
    			50,
    			12
    		],
    		[
    			4,
    			30
    		],
    		[
    			49,
    			45
    		],
    		[
    			81,
    			43
    		],
    		[
    			85,
    			9
    		],
    		[
    			32,
    			-20
    		],
    		[
    			25,
    			-69
    		],
    		[
    			30,
    			32
    		],
    		[
    			24,
    			-3
    		],
    		[
    			9,
    			57
    		],
    		[
    			34,
    			59
    		],
    		[
    			93,
    			60
    		],
    		[
    			43,
    			13
    		],
    		[
    			98,
    			47
    		],
    		[
    			43,
    			-19
    		],
    		[
    			-1,
    			40
    		],
    		[
    			31,
    			50
    		],
    		[
    			41,
    			42
    		],
    		[
    			35,
    			14
    		],
    		[
    			27,
    			30
    		],
    		[
    			40,
    			19
    		],
    		[
    			3,
    			44
    		],
    		[
    			33,
    			112
    		],
    		[
    			24,
    			26
    		],
    		[
    			-11,
    			20
    		],
    		[
    			22,
    			66
    		],
    		[
    			60,
    			51
    		],
    		[
    			6,
    			48
    		],
    		[
    			-36,
    			-6
    		],
    		[
    			-113,
    			-44
    		],
    		[
    			-34,
    			17
    		],
    		[
    			-3,
    			27
    		],
    		[
    			-49,
    			42
    		],
    		[
    			-21,
    			-37
    		],
    		[
    			7,
    			-66
    		],
    		[
    			-11,
    			-28
    		],
    		[
    			-36,
    			11
    		],
    		[
    			-25,
    			92
    		],
    		[
    			-44,
    			67
    		],
    		[
    			-31,
    			-36
    		],
    		[
    			-73,
    			86
    		],
    		[
    			-38,
    			-24
    		],
    		[
    			-81,
    			-23
    		],
    		[
    			-17,
    			-29
    		],
    		[
    			-61,
    			-19
    		],
    		[
    			-12,
    			34
    		],
    		[
    			28,
    			39
    		],
    		[
    			4,
    			48
    		],
    		[
    			-19,
    			93
    		],
    		[
    			20,
    			29
    		],
    		[
    			41,
    			27
    		],
    		[
    			-27,
    			114
    		],
    		[
    			0,
    			28
    		],
    		[
    			-23,
    			71
    		],
    		[
    			-19,
    			-8
    		],
    		[
    			-15,
    			-41
    		],
    		[
    			-79,
    			-16
    		],
    		[
    			-51,
    			-3
    		],
    		[
    			-69,
    			18
    		],
    		[
    			-21,
    			16
    		],
    		[
    			-4,
    			32
    		],
    		[
    			-35,
    			113
    		],
    		[
    			-21,
    			10
    		],
    		[
    			-28,
    			49
    		],
    		[
    			-12,
    			46
    		],
    		[
    			53,
    			31
    		],
    		[
    			22,
    			29
    		],
    		[
    			-31,
    			35
    		],
    		[
    			15,
    			41
    		],
    		[
    			-58,
    			26
    		],
    		[
    			12,
    			47
    		],
    		[
    			-31,
    			26
    		],
    		[
    			8,
    			66
    		],
    		[
    			-22,
    			32
    		],
    		[
    			27,
    			17
    		],
    		[
    			-4,
    			31
    		],
    		[
    			62,
    			-8
    		],
    		[
    			-4,
    			58
    		],
    		[
    			25,
    			32
    		],
    		[
    			75,
    			71
    		],
    		[
    			60,
    			19
    		],
    		[
    			-3,
    			39
    		],
    		[
    			26,
    			62
    		],
    		[
    			38,
    			22
    		],
    		[
    			-1,
    			23
    		],
    		[
    			39,
    			24
    		],
    		[
    			33,
    			-3
    		],
    		[
    			54,
    			-52
    		],
    		[
    			15,
    			-36
    		],
    		[
    			38,
    			0
    		],
    		[
    			55,
    			36
    		],
    		[
    			48,
    			53
    		],
    		[
    			39,
    			12
    		],
    		[
    			27,
    			-28
    		],
    		[
    			84,
    			0
    		],
    		[
    			53,
    			59
    		],
    		[
    			9,
    			28
    		],
    		[
    			-8,
    			78
    		],
    		[
    			7,
    			34
    		],
    		[
    			-24,
    			54
    		],
    		[
    			-23,
    			20
    		],
    		[
    			14,
    			30
    		],
    		[
    			34,
    			-19
    		],
    		[
    			39,
    			29
    		],
    		[
    			0,
    			58
    		],
    		[
    			-31,
    			31
    		],
    		[
    			-44,
    			-32
    		],
    		[
    			-13,
    			9
    		],
    		[
    			-66,
    			-13
    		],
    		[
    			-50,
    			-32
    		],
    		[
    			-19,
    			-40
    		],
    		[
    			-19,
    			39
    		],
    		[
    			-34,
    			20
    		],
    		[
    			-13,
    			-17
    		],
    		[
    			-33,
    			37
    		],
    		[
    			-91,
    			20
    		],
    		[
    			-77,
    			-13
    		],
    		[
    			-68,
    			48
    		],
    		[
    			-57,
    			33
    		],
    		[
    			-18,
    			53
    		],
    		[
    			18,
    			32
    		],
    		[
    			-22,
    			68
    		],
    		[
    			60,
    			48
    		],
    		[
    			-67,
    			55
    		],
    		[
    			-38,
    			17
    		],
    		[
    			-56,
    			95
    		]
    	],
    	[
    		[
    			185,
    			157
    		],
    		[
    			52,
    			22
    		],
    		[
    			27,
    			51
    		],
    		[
    			38,
    			23
    		],
    		[
    			41,
    			-17
    		],
    		[
    			3,
    			47
    		],
    		[
    			36,
    			20
    		],
    		[
    			39,
    			-1
    		],
    		[
    			11,
    			-59
    		],
    		[
    			-92,
    			-24
    		],
    		[
    			-32,
    			-34
    		],
    		[
    			-123,
    			-28
    		]
    	],
    	[
    		[
    			804,
    			3232
    		],
    		[
    			11,
    			24
    		],
    		[
    			40,
    			11
    		],
    		[
    			64,
    			-54
    		],
    		[
    			38,
    			15
    		],
    		[
    			43,
    			-10
    		],
    		[
    			14,
    			-37
    		],
    		[
    			-6,
    			-26
    		],
    		[
    			41,
    			-36
    		],
    		[
    			12,
    			-26
    		],
    		[
    			86,
    			-49
    		],
    		[
    			-34,
    			-37
    		],
    		[
    			-24,
    			19
    		],
    		[
    			-34,
    			3
    		],
    		[
    			-34,
    			-24
    		],
    		[
    			-40,
    			58
    		],
    		[
    			-26,
    			19
    		],
    		[
    			-18,
    			58
    		],
    		[
    			-55,
    			40
    		],
    		[
    			-49,
    			-16
    		],
    		[
    			-24,
    			28
    		],
    		[
    			-5,
    			40
    		]
    	],
    	[
    		[
    			2666,
    			14706
    		],
    		[
    			65,
    			-17
    		],
    		[
    			353,
    			-98
    		],
    		[
    			270,
    			-72
    		],
    		[
    			104,
    			-24
    		],
    		[
    			465,
    			-115
    		],
    		[
    			318,
    			-76
    		]
    	],
    	[
    		[
    			5128,
    			10065
    		],
    		[
    			-43,
    			-243
    		],
    		[
    			-40,
    			-241
    		],
    		[
    			-26,
    			-145
    		],
    		[
    			-16,
    			-9
    		],
    		[
    			-61,
    			-100
    		],
    		[
    			-61,
    			-6
    		],
    		[
    			-59,
    			116
    		],
    		[
    			-44,
    			-5
    		],
    		[
    			-34,
    			26
    		],
    		[
    			-73,
    			10
    		],
    		[
    			-34,
    			-20
    		],
    		[
    			-46,
    			-10
    		],
    		[
    			11,
    			-48
    		],
    		[
    			-18,
    			-38
    		],
    		[
    			13,
    			-62
    		],
    		[
    			17,
    			-27
    		],
    		[
    			-29,
    			-14
    		],
    		[
    			-7,
    			-73
    		],
    		[
    			-12,
    			-33
    		],
    		[
    			1,
    			-49
    		],
    		[
    			15,
    			-36
    		],
    		[
    			-14,
    			-19
    		],
    		[
    			1,
    			-40
    		],
    		[
    			-19,
    			-32
    		],
    		[
    			18,
    			-68
    		],
    		[
    			6,
    			-70
    		],
    		[
    			-5,
    			-113
    		],
    		[
    			-8,
    			-34
    		],
    		[
    			-47,
    			-24
    		],
    		[
    			19,
    			-22
    		],
    		[
    			-28,
    			-53
    		]
    	],
    	[
    		[
    			18157,
    			11740
    		],
    		[
    			23,
    			12
    		],
    		[
    			0,
    			96
    		],
    		[
    			-22,
    			23
    		],
    		[
    			30,
    			54
    		],
    		[
    			54,
    			26
    		],
    		[
    			34,
    			1
    		],
    		[
    			34,
    			27
    		],
    		[
    			14,
    			88
    		],
    		[
    			-4,
    			25
    		],
    		[
    			50,
    			80
    		],
    		[
    			19,
    			14
    		],
    		[
    			7,
    			87
    		],
    		[
    			-5,
    			49
    		],
    		[
    			-26,
    			45
    		],
    		[
    			-29,
    			7
    		],
    		[
    			-42,
    			57
    		],
    		[
    			17,
    			49
    		],
    		[
    			13,
    			87
    		],
    		[
    			39,
    			21
    		],
    		[
    			25,
    			-9
    		],
    		[
    			38,
    			27
    		],
    		[
    			66,
    			2
    		],
    		[
    			44,
    			12
    		],
    		[
    			32,
    			41
    		],
    		[
    			29,
    			13
    		],
    		[
    			43,
    			1
    		],
    		[
    			25,
    			35
    		],
    		[
    			37,
    			20
    		],
    		[
    			-2,
    			47
    		],
    		[
    			11,
    			70
    		],
    		[
    			19,
    			27
    		],
    		[
    			47,
    			31
    		],
    		[
    			14,
    			83
    		],
    		[
    			-7,
    			43
    		],
    		[
    			10,
    			34
    		],
    		[
    			-15,
    			30
    		],
    		[
    			-2,
    			59
    		],
    		[
    			-27,
    			26
    		],
    		[
    			-102,
    			51
    		],
    		[
    			-24,
    			41
    		],
    		[
    			7,
    			35
    		],
    		[
    			-36,
    			46
    		],
    		[
    			-44,
    			23
    		],
    		[
    			-9,
    			20
    		],
    		[
    			-47,
    			26
    		],
    		[
    			5,
    			24
    		]
    	],
    	[
    		[
    			18500,
    			13446
    		],
    		[
    			307,
    			20
    		],
    		[
    			445,
    			23
    		],
    		[
    			251,
    			15
    		],
    		[
    			79,
    			9
    		],
    		[
    			282,
    			25
    		],
    		[
    			169,
    			13
    		]
    	],
    	[
    		[
    			20033,
    			13551
    		],
    		[
    			6,
    			-81
    		],
    		[
    			-11,
    			-71
    		],
    		[
    			24,
    			-70
    		],
    		[
    			41,
    			-68
    		],
    		[
    			32,
    			-33
    		],
    		[
    			30,
    			-84
    		],
    		[
    			25,
    			-93
    		],
    		[
    			24,
    			-50
    		],
    		[
    			25,
    			-23
    		],
    		[
    			6,
    			-31
    		]
    	],
    	[
    		[
    			20235,
    			12947
    		],
    		[
    			26,
    			-323
    		],
    		[
    			53,
    			-634
    		],
    		[
    			37,
    			-490
    		],
    		[
    			36,
    			-413
    		],
    		[
    			-32,
    			-15
    		],
    		[
    			-4,
    			-57
    		],
    		[
    			20,
    			-33
    		],
    		[
    			-42,
    			-70
    		],
    		[
    			54,
    			-57
    		],
    		[
    			2,
    			-56
    		],
    		[
    			28,
    			-9
    		],
    		[
    			10,
    			-30
    		],
    		[
    			-13,
    			-36
    		],
    		[
    			14,
    			-55
    		],
    		[
    			20,
    			-24
    		],
    		[
    			-13,
    			-82
    		],
    		[
    			-37,
    			-19
    		],
    		[
    			-9,
    			-63
    		],
    		[
    			-23,
    			-38
    		],
    		[
    			0,
    			-27
    		],
    		[
    			-22,
    			-24
    		],
    		[
    			-13,
    			-58
    		],
    		[
    			-44,
    			-69
    		],
    		[
    			-4,
    			-39
    		],
    		[
    			-61,
    			-7
    		],
    		[
    			-6,
    			-68
    		],
    		[
    			36,
    			-17
    		],
    		[
    			-18,
    			-33
    		],
    		[
    			-39,
    			-27
    		],
    		[
    			31,
    			-21
    		],
    		[
    			-37,
    			-31
    		],
    		[
    			16,
    			-42
    		],
    		[
    			-12,
    			-18
    		],
    		[
    			17,
    			-47
    		],
    		[
    			-47,
    			-5
    		],
    		[
    			44,
    			-72
    		]
    	],
    	[
    		[
    			20203,
    			9838
    		],
    		[
    			-16,
    			-49
    		],
    		[
    			-34,
    			-28
    		],
    		[
    			-16,
    			-36
    		],
    		[
    			20,
    			-70
    		],
    		[
    			40,
    			-35
    		],
    		[
    			-4,
    			-42
    		],
    		[
    			-115,
    			-26
    		],
    		[
    			-43,
    			-43
    		],
    		[
    			-29,
    			15
    		],
    		[
    			-37,
    			-34
    		],
    		[
    			-16,
    			-83
    		],
    		[
    			44,
    			-60
    		],
    		[
    			16,
    			-39
    		],
    		[
    			-15,
    			-64
    		],
    		[
    			-36,
    			-9
    		],
    		[
    			-31,
    			8
    		],
    		[
    			-24,
    			24
    		],
    		[
    			-72,
    			19
    		],
    		[
    			-45,
    			32
    		],
    		[
    			-67,
    			23
    		],
    		[
    			-34,
    			2
    		],
    		[
    			-31,
    			-17
    		],
    		[
    			-65,
    			-103
    		],
    		[
    			-14,
    			-42
    		],
    		[
    			32,
    			-41
    		]
    	],
    	[
    		[
    			27306,
    			16827
    		],
    		[
    			251,
    			70
    		],
    		[
    			130,
    			32
    		],
    		[
    			143,
    			31
    		],
    		[
    			406,
    			120
    		]
    	],
    	[
    		[
    			28236,
    			17080
    		],
    		[
    			-13,
    			-27
    		],
    		[
    			36,
    			-51
    		],
    		[
    			-20,
    			-55
    		],
    		[
    			3,
    			-43
    		],
    		[
    			-18,
    			-46
    		],
    		[
    			76,
    			-107
    		],
    		[
    			-14,
    			-86
    		],
    		[
    			-19,
    			-12
    		],
    		[
    			-23,
    			-60
    		],
    		[
    			-40,
    			-20
    		],
    		[
    			-3,
    			-35
    		],
    		[
    			-105,
    			-60
    		],
    		[
    			-9,
    			-43
    		],
    		[
    			16,
    			-22
    		],
    		[
    			0,
    			-40
    		],
    		[
    			19,
    			-23
    		],
    		[
    			15,
    			-50
    		],
    		[
    			-24,
    			-83
    		],
    		[
    			11,
    			-58
    		],
    		[
    			-22,
    			-57
    		],
    		[
    			11,
    			-39
    		],
    		[
    			-15,
    			-50
    		],
    		[
    			-27,
    			-45
    		],
    		[
    			3,
    			-83
    		],
    		[
    			-17,
    			-21
    		],
    		[
    			-1,
    			-54
    		],
    		[
    			12,
    			-13
    		],
    		[
    			7,
    			-104
    		],
    		[
    			19,
    			-35
    		],
    		[
    			-11,
    			-48
    		],
    		[
    			9,
    			-88
    		],
    		[
    			22,
    			-43
    		],
    		[
    			-10,
    			-31
    		],
    		[
    			19,
    			-29
    		],
    		[
    			-8,
    			-33
    		],
    		[
    			-28,
    			-26
    		],
    		[
    			11,
    			-22
    		],
    		[
    			-5,
    			-55
    		],
    		[
    			18,
    			-34
    		],
    		[
    			56,
    			-49
    		]
    	],
    	[
    		[
    			5840,
    			19553
    		],
    		[
    			403,
    			-92
    		],
    		[
    			401,
    			-83
    		],
    		[
    			328,
    			-71
    		],
    		[
    			330,
    			-64
    		],
    		[
    			312,
    			-59
    		],
    		[
    			418,
    			-77
    		],
    		[
    			240,
    			-41
    		],
    		[
    			404,
    			-65
    		],
    		[
    			569,
    			-87
    		],
    		[
    			249,
    			-36
    		],
    		[
    			510,
    			-69
    		],
    		[
    			468,
    			-58
    		],
    		[
    			210,
    			-24
    		],
    		[
    			573,
    			-62
    		],
    		[
    			404,
    			-37
    		]
    	],
    	[
    		[
    			11659,
    			18628
    		],
    		[
    			-24,
    			-311
    		],
    		[
    			-42,
    			-571
    		],
    		[
    			-34,
    			-404
    		],
    		[
    			-87,
    			-1090
    		]
    	],
    	[
    		[
    			15362,
    			14143
    		],
    		[
    			501,
    			-1
    		],
    		[
    			556,
    			7
    		],
    		[
    			267,
    			5
    		],
    		[
    			372,
    			9
    		],
    		[
    			257,
    			9
    		],
    		[
    			607,
    			27
    		],
    		[
    			231,
    			12
    		]
    	],
    	[
    		[
    			18153,
    			14211
    		],
    		[
    			-7,
    			-33
    		],
    		[
    			21,
    			-50
    		],
    		[
    			0,
    			-36
    		],
    		[
    			39,
    			-16
    		],
    		[
    			41,
    			-55
    		],
    		[
    			-31,
    			-44
    		],
    		[
    			-28,
    			-58
    		],
    		[
    			5,
    			-71
    		],
    		[
    			18,
    			-59
    		],
    		[
    			2,
    			-42
    		],
    		[
    			25,
    			-20
    		],
    		[
    			33,
    			-113
    		],
    		[
    			55,
    			-37
    		],
    		[
    			127,
    			-29
    		],
    		[
    			34,
    			-55
    		],
    		[
    			13,
    			-47
    		]
    	],
    	[
    		[
    			26166,
    			7548
    		],
    		[
    			-96,
    			-60
    		],
    		[
    			-52,
    			-56
    		],
    		[
    			-61,
    			-95
    		],
    		[
    			-44,
    			-101
    		],
    		[
    			-23,
    			-37
    		],
    		[
    			-25,
    			-89
    		],
    		[
    			-6,
    			-45
    		],
    		[
    			11,
    			-88
    		],
    		[
    			-6,
    			-35
    		],
    		[
    			-25,
    			-40
    		],
    		[
    			-46,
    			-40
    		],
    		[
    			-9,
    			-64
    		],
    		[
    			-74,
    			-13
    		],
    		[
    			-33,
    			14
    		],
    		[
    			-21,
    			-21
    		],
    		[
    			-19,
    			-58
    		],
    		[
    			27,
    			-26
    		],
    		[
    			-64,
    			-56
    		],
    		[
    			-11,
    			-38
    		],
    		[
    			-68,
    			-55
    		],
    		[
    			-18,
    			-5
    		],
    		[
    			3,
    			-54
    		],
    		[
    			-45,
    			-42
    		],
    		[
    			-14,
    			-30
    		],
    		[
    			-23,
    			-1
    		],
    		[
    			-49,
    			-25
    		],
    		[
    			-23,
    			-28
    		],
    		[
    			-46,
    			-28
    		],
    		[
    			-46,
    			-54
    		],
    		[
    			-21,
    			10
    		],
    		[
    			-28,
    			-25
    		],
    		[
    			-22,
    			24
    		],
    		[
    			-20,
    			-39
    		],
    		[
    			42,
    			-49
    		],
    		[
    			-6,
    			-55
    		],
    		[
    			-65,
    			-48
    		],
    		[
    			-45,
    			-21
    		],
    		[
    			-4,
    			24
    		],
    		[
    			-42,
    			19
    		],
    		[
    			-31,
    			-36
    		],
    		[
    			53,
    			-24
    		],
    		[
    			13,
    			-22
    		],
    		[
    			-38,
    			-64
    		],
    		[
    			-41,
    			-34
    		],
    		[
    			-14,
    			5
    		],
    		[
    			-31,
    			-61
    		],
    		[
    			14,
    			-8
    		]
    	],
    	[
    		[
    			28236,
    			17080
    		],
    		[
    			-9,
    			43
    		],
    		[
    			13,
    			16
    		],
    		[
    			14,
    			126
    		],
    		[
    			37,
    			65
    		],
    		[
    			38,
    			-31
    		],
    		[
    			48,
    			9
    		],
    		[
    			14,
    			54
    		]
    	],
    	[
    		[
    			28391,
    			17362
    		],
    		[
    			15,
    			-44
    		],
    		[
    			136,
    			-442
    		],
    		[
    			134,
    			-463
    		],
    		[
    			53,
    			-187
    		],
    		[
    			51,
    			-167
    		],
    		[
    			15,
    			-12
    		],
    		[
    			3,
    			-52
    		],
    		[
    			13,
    			-35
    		],
    		[
    			-8,
    			-22
    		],
    		[
    			23,
    			-51
    		],
    		[
    			31,
    			-10
    		],
    		[
    			27,
    			-31
    		],
    		[
    			40,
    			-17
    		],
    		[
    			17,
    			-86
    		],
    		[
    			76,
    			-33
    		]
    	],
    	[
    		[
    			29017,
    			15710
    		],
    		[
    			-25,
    			-132
    		],
    		[
    			3,
    			-28
    		]
    	],
    	[
    		[
    			7434,
    			5125
    		],
    		[
    			-591,
    			90
    		],
    		[
    			-285,
    			46
    		],
    		[
    			-381,
    			63
    		],
    		[
    			-404,
    			248
    		],
    		[
    			-633,
    			389
    		],
    		[
    			-148,
    			91
    		],
    		[
    			-356,
    			227
    		],
    		[
    			-601,
    			386
    		],
    		[
    			22,
    			50
    		],
    		[
    			-2,
    			45
    		],
    		[
    			31,
    			14
    		],
    		[
    			38,
    			53
    		]
    	],
    	[
    		[
    			26272,
    			11666
    		],
    		[
    			35,
    			56
    		],
    		[
    			88,
    			-63
    		],
    		[
    			-57,
    			-94
    		]
    	],
    	[
    		[
    			27690,
    			13434
    		],
    		[
    			-27,
    			-56
    		],
    		[
    			-35,
    			-12
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-19,
    			-17
    		],
    		[
    			4,
    			-53
    		],
    		[
    			-19,
    			-18
    		],
    		[
    			11,
    			-66
    		],
    		[
    			40,
    			-9
    		],
    		[
    			28,
    			20
    		],
    		[
    			79,
    			-17
    		],
    		[
    			29,
    			-39
    		],
    		[
    			6,
    			-43
    		],
    		[
    			2,
    			-144
    		],
    		[
    			5,
    			-115
    		],
    		[
    			18,
    			-167
    		],
    		[
    			-11,
    			-67
    		],
    		[
    			-32,
    			-117
    		],
    		[
    			-21,
    			-48
    		],
    		[
    			-8,
    			-53
    		],
    		[
    			-38,
    			-78
    		],
    		[
    			-33,
    			-29
    		],
    		[
    			-53,
    			-82
    		],
    		[
    			-21,
    			-58
    		],
    		[
    			-37,
    			-161
    		],
    		[
    			-26,
    			-37
    		],
    		[
    			-41,
    			-31
    		],
    		[
    			-24,
    			4
    		],
    		[
    			0,
    			49
    		],
    		[
    			14,
    			74
    		],
    		[
    			-2,
    			57
    		],
    		[
    			-86,
    			24
    		],
    		[
    			-76,
    			-27
    		],
    		[
    			-7,
    			24
    		],
    		[
    			-46,
    			21
    		],
    		[
    			-10,
    			19
    		],
    		[
    			-36,
    			0
    		],
    		[
    			-16,
    			24
    		],
    		[
    			-29,
    			1
    		],
    		[
    			-59,
    			55
    		],
    		[
    			-42,
    			7
    		],
    		[
    			-12,
    			62
    		],
    		[
    			7,
    			32
    		],
    		[
    			-29,
    			16
    		],
    		[
    			-6,
    			18
    		],
    		[
    			31,
    			75
    		],
    		[
    			2,
    			43
    		],
    		[
    			19,
    			34
    		]
    	],
    	[
    		[
    			27051,
    			11045
    		],
    		[
    			-30,
    			-7
    		],
    		[
    			-9,
    			62
    		],
    		[
    			39,
    			-14
    		],
    		[
    			0,
    			-41
    		]
    	],
    	[
    		[
    			26889,
    			12440
    		],
    		[
    			32,
    			-132
    		],
    		[
    			219,
    			-832
    		],
    		[
    			150,
    			29
    		],
    		[
    			212,
    			49
    		]
    	],
    	[
    		[
    			27502,
    			11554
    		],
    		[
    			0,
    			-103
    		],
    		[
    			-7,
    			-12
    		],
    		[
    			-17,
    			-179
    		],
    		[
    			-16,
    			-60
    		]
    	],
    	[
    		[
    			27244,
    			11100
    		],
    		[
    			-40,
    			0
    		],
    		[
    			-38,
    			-13
    		],
    		[
    			-21,
    			-39
    		],
    		[
    			-31,
    			-19
    		],
    		[
    			-9,
    			63
    		],
    		[
    			38,
    			62
    		],
    		[
    			-45,
    			4
    		],
    		[
    			14,
    			41
    		],
    		[
    			-28,
    			11
    		],
    		[
    			-32,
    			-27
    		],
    		[
    			-8,
    			49
    		],
    		[
    			41,
    			21
    		],
    		[
    			22,
    			25
    		],
    		[
    			-61,
    			17
    		],
    		[
    			-37,
    			-5
    		],
    		[
    			-22,
    			31
    		],
    		[
    			23,
    			13
    		],
    		[
    			-12,
    			33
    		],
    		[
    			-33,
    			-58
    		],
    		[
    			13,
    			-47
    		],
    		[
    			-49,
    			36
    		],
    		[
    			-30,
    			6
    		],
    		[
    			-17,
    			31
    		],
    		[
    			-38,
    			-5
    		],
    		[
    			-65,
    			81
    		],
    		[
    			36,
    			21
    		],
    		[
    			6,
    			22
    		],
    		[
    			-31,
    			30
    		],
    		[
    			0,
    			34
    		],
    		[
    			90,
    			29
    		],
    		[
    			-84,
    			55
    		],
    		[
    			-63,
    			15
    		],
    		[
    			13,
    			67
    		],
    		[
    			58,
    			-7
    		],
    		[
    			-26,
    			108
    		],
    		[
    			-36,
    			-10
    		],
    		[
    			-33,
    			-32
    		],
    		[
    			13,
    			-35
    		],
    		[
    			-16,
    			-15
    		],
    		[
    			-13,
    			69
    		],
    		[
    			12,
    			48
    		],
    		[
    			72,
    			-2
    		],
    		[
    			17,
    			25
    		],
    		[
    			-26,
    			73
    		],
    		[
    			-18,
    			-45
    		],
    		[
    			-21,
    			64
    		],
    		[
    			-20,
    			8
    		],
    		[
    			24,
    			146
    		],
    		[
    			33,
    			50
    		],
    		[
    			50,
    			3
    		],
    		[
    			-12,
    			31
    		],
    		[
    			23,
    			31
    		],
    		[
    			-14,
    			21
    		],
    		[
    			2,
    			75
    		],
    		[
    			-66,
    			-32
    		],
    		[
    			-8,
    			-40
    		],
    		[
    			41,
    			-23
    		],
    		[
    			-48,
    			-46
    		],
    		[
    			-15,
    			-34
    		],
    		[
    			-43,
    			-51
    		],
    		[
    			-23,
    			52
    		],
    		[
    			-26,
    			-1
    		],
    		[
    			23,
    			-51
    		],
    		[
    			-27,
    			-37
    		],
    		[
    			-11,
    			-70
    		],
    		[
    			-33,
    			-8
    		],
    		[
    			-13,
    			-22
    		],
    		[
    			59,
    			-24
    		],
    		[
    			8,
    			-63
    		],
    		[
    			31,
    			-25
    		],
    		[
    			-41,
    			-34
    		],
    		[
    			21,
    			-29
    		],
    		[
    			-23,
    			-76
    		],
    		[
    			15,
    			-27
    		],
    		[
    			-22,
    			-62
    		],
    		[
    			20,
    			-12
    		],
    		[
    			4,
    			-36
    		],
    		[
    			21,
    			-46
    		],
    		[
    			11,
    			-68
    		],
    		[
    			19,
    			-33
    		],
    		[
    			77,
    			-61
    		],
    		[
    			-11,
    			-54
    		],
    		[
    			15,
    			-8
    		],
    		[
    			20,
    			-69
    		],
    		[
    			49,
    			-53
    		],
    		[
    			-36,
    			-37
    		],
    		[
    			-30,
    			20
    		],
    		[
    			-21,
    			-21
    		],
    		[
    			-40,
    			21
    		],
    		[
    			-37,
    			41
    		],
    		[
    			-84,
    			8
    		],
    		[
    			-67,
    			-7
    		],
    		[
    			-38,
    			18
    		],
    		[
    			-42,
    			34
    		],
    		[
    			-43,
    			75
    		],
    		[
    			-94,
    			-90
    		],
    		[
    			-28,
    			13
    		],
    		[
    			-28,
    			74
    		],
    		[
    			19,
    			63
    		],
    		[
    			40,
    			73
    		]
    	],
    	[
    		[
    			29923,
    			16883
    		],
    		[
    			17,
    			36
    		],
    		[
    			43,
    			-16
    		],
    		[
    			-20,
    			-39
    		],
    		[
    			-40,
    			19
    		]
    	],
    	[
    		[
    			29792,
    			16898
    		],
    		[
    			25,
    			47
    		],
    		[
    			63,
    			-33
    		],
    		[
    			-29,
    			-49
    		],
    		[
    			-34,
    			-11
    		],
    		[
    			-25,
    			46
    		]
    	],
    	[
    		[
    			29727,
    			16774
    		],
    		[
    			50,
    			32
    		],
    		[
    			25,
    			-23
    		],
    		[
    			-12,
    			-42
    		],
    		[
    			-28,
    			-9
    		],
    		[
    			-35,
    			42
    		]
    	],
    	[
    		[
    			29707,
    			16781
    		],
    		[
    			7,
    			32
    		],
    		[
    			28,
    			38
    		],
    		[
    			16,
    			-23
    		],
    		[
    			-51,
    			-47
    		]
    	],
    	[
    		[
    			28391,
    			17362
    		],
    		[
    			59,
    			44
    		],
    		[
    			54,
    			-69
    		],
    		[
    			23,
    			76
    		],
    		[
    			-25,
    			58
    		],
    		[
    			16,
    			30
    		],
    		[
    			43,
    			-21
    		],
    		[
    			33,
    			-1
    		],
    		[
    			8,
    			25
    		],
    		[
    			-21,
    			26
    		],
    		[
    			-42,
    			25
    		],
    		[
    			0,
    			58
    		],
    		[
    			13,
    			41
    		],
    		[
    			70,
    			101
    		],
    		[
    			30,
    			20
    		],
    		[
    			0,
    			24
    		],
    		[
    			-23,
    			30
    		],
    		[
    			26,
    			54
    		],
    		[
    			25,
    			24
    		],
    		[
    			8,
    			60
    		],
    		[
    			-37,
    			7
    		],
    		[
    			-17,
    			39
    		],
    		[
    			0,
    			61
    		],
    		[
    			15,
    			44
    		],
    		[
    			-36,
    			29
    		],
    		[
    			7,
    			19
    		],
    		[
    			8,
    			99
    		],
    		[
    			23,
    			29
    		],
    		[
    			19,
    			48
    		],
    		[
    			15,
    			8
    		],
    		[
    			-26,
    			220
    		],
    		[
    			222,
    			689
    		],
    		[
    			23,
    			5
    		],
    		[
    			77,
    			-11
    		],
    		[
    			-1,
    			-30
    		],
    		[
    			33,
    			-97
    		],
    		[
    			77,
    			-25
    		],
    		[
    			81,
    			70
    		],
    		[
    			50,
    			19
    		],
    		[
    			7,
    			38
    		],
    		[
    			48,
    			23
    		],
    		[
    			47,
    			6
    		],
    		[
    			-10,
    			43
    		],
    		[
    			20,
    			20
    		],
    		[
    			55,
    			5
    		],
    		[
    			39,
    			-6
    		],
    		[
    			13,
    			-17
    		],
    		[
    			110,
    			-46
    		],
    		[
    			49,
    			-54
    		],
    		[
    			56,
    			-16
    		],
    		[
    			101,
    			-349
    		],
    		[
    			73,
    			-240
    		],
    		[
    			73,
    			-252
    		],
    		[
    			20,
    			-14
    		],
    		[
    			-19,
    			-35
    		],
    		[
    			37,
    			-36
    		],
    		[
    			-19,
    			-23
    		],
    		[
    			27,
    			-95
    		],
    		[
    			37,
    			2
    		],
    		[
    			74,
    			-24
    		],
    		[
    			94,
    			12
    		],
    		[
    			19,
    			-57
    		],
    		[
    			-31,
    			-33
    		],
    		[
    			25,
    			-37
    		],
    		[
    			30,
    			-17
    		],
    		[
    			9,
    			-35
    		],
    		[
    			-8,
    			-60
    		],
    		[
    			13,
    			-21
    		],
    		[
    			79,
    			-68
    		],
    		[
    			16,
    			7
    		],
    		[
    			3,
    			48
    		],
    		[
    			37,
    			-8
    		],
    		[
    			35,
    			9
    		],
    		[
    			33,
    			-29
    		],
    		[
    			33,
    			-57
    		],
    		[
    			44,
    			-59
    		],
    		[
    			31,
    			-12
    		],
    		[
    			9,
    			-53
    		],
    		[
    			18,
    			-24
    		],
    		[
    			-56,
    			-113
    		],
    		[
    			-15,
    			-45
    		],
    		[
    			-30,
    			7
    		],
    		[
    			-32,
    			-15
    		],
    		[
    			-11,
    			35
    		],
    		[
    			-33,
    			-27
    		],
    		[
    			21,
    			-33
    		],
    		[
    			-11,
    			-42
    		],
    		[
    			-77,
    			2
    		],
    		[
    			-1,
    			-55
    		],
    		[
    			11,
    			-20
    		],
    		[
    			-66,
    			-20
    		],
    		[
    			-78,
    			-38
    		],
    		[
    			-4,
    			-40
    		],
    		[
    			-69,
    			-124
    		],
    		[
    			-30,
    			34
    		],
    		[
    			-16,
    			50
    		],
    		[
    			-57,
    			2
    		],
    		[
    			-33,
    			-28
    		],
    		[
    			31,
    			-22
    		],
    		[
    			56,
    			-54
    		],
    		[
    			-14,
    			-50
    		],
    		[
    			-48,
    			-17
    		],
    		[
    			18,
    			-43
    		],
    		[
    			-53,
    			4
    		],
    		[
    			-23,
    			29
    		],
    		[
    			0,
    			64
    		],
    		[
    			18,
    			19
    		],
    		[
    			-22,
    			26
    		],
    		[
    			-84,
    			-58
    		],
    		[
    			19,
    			-26
    		],
    		[
    			0,
    			-39
    		],
    		[
    			33,
    			-30
    		],
    		[
    			-12,
    			-16
    		],
    		[
    			-34,
    			15
    		],
    		[
    			-91,
    			16
    		],
    		[
    			-30,
    			-24
    		],
    		[
    			-4,
    			50
    		],
    		[
    			-28,
    			60
    		],
    		[
    			-75,
    			-53
    		],
    		[
    			37,
    			-43
    		],
    		[
    			3,
    			-25
    		],
    		[
    			-29,
    			-104
    		],
    		[
    			6,
    			-101
    		],
    		[
    			24,
    			3
    		],
    		[
    			-44,
    			-89
    		],
    		[
    			-4,
    			-37
    		],
    		[
    			-33,
    			-9
    		],
    		[
    			-58,
    			23
    		],
    		[
    			-35,
    			-25
    		],
    		[
    			3,
    			-63
    		],
    		[
    			-8,
    			-52
    		],
    		[
    			-24,
    			-10
    		],
    		[
    			-32,
    			10
    		],
    		[
    			-32,
    			-49
    		],
    		[
    			-21,
    			-61
    		],
    		[
    			-36,
    			-32
    		],
    		[
    			-32,
    			40
    		],
    		[
    			-31,
    			-5
    		],
    		[
    			-19,
    			-38
    		],
    		[
    			-31,
    			-6
    		],
    		[
    			25,
    			89
    		],
    		[
    			-35,
    			-2
    		],
    		[
    			-52,
    			-84
    		],
    		[
    			-32,
    			-83
    		],
    		[
    			34,
    			-40
    		],
    		[
    			17,
    			-43
    		],
    		[
    			-38,
    			-13
    		],
    		[
    			-39,
    			-39
    		],
    		[
    			-5,
    			-29
    		],
    		[
    			23,
    			-39
    		],
    		[
    			-24,
    			-48
    		],
    		[
    			11,
    			-20
    		],
    		[
    			-49,
    			-28
    		],
    		[
    			-17,
    			-33
    		],
    		[
    			-4,
    			-51
    		],
    		[
    			15,
    			-18
    		],
    		[
    			-21,
    			-130
    		],
    		[
    			-14,
    			-13
    		]
    	],
    	[
    		[
    			9297,
    			945
    		],
    		[
    			10,
    			41
    		],
    		[
    			46,
    			48
    		],
    		[
    			29,
    			5
    		],
    		[
    			32,
    			62
    		],
    		[
    			40,
    			35
    		],
    		[
    			7,
    			42
    		],
    		[
    			-43,
    			62
    		],
    		[
    			-14,
    			71
    		],
    		[
    			11,
    			43
    		],
    		[
    			34,
    			13
    		],
    		[
    			57,
    			-23
    		],
    		[
    			22,
    			-29
    		],
    		[
    			51,
    			-28
    		],
    		[
    			43,
    			-36
    		],
    		[
    			23,
    			8
    		],
    		[
    			82,
    			-28
    		],
    		[
    			97,
    			-53
    		],
    		[
    			65,
    			-42
    		],
    		[
    			42,
    			-38
    		],
    		[
    			44,
    			-66
    		],
    		[
    			-5,
    			-79
    		],
    		[
    			60,
    			2
    		],
    		[
    			18,
    			-37
    		],
    		[
    			0,
    			-40
    		],
    		[
    			53,
    			-54
    		],
    		[
    			64,
    			-32
    		],
    		[
    			-6,
    			-37
    		],
    		[
    			-104,
    			-102
    		],
    		[
    			-69,
    			-31
    		],
    		[
    			-40,
    			-30
    		],
    		[
    			-44,
    			-14
    		],
    		[
    			-49,
    			11
    		],
    		[
    			-21,
    			-6
    		],
    		[
    			-36,
    			-38
    		],
    		[
    			-48,
    			-24
    		],
    		[
    			-25,
    			-29
    		],
    		[
    			-35,
    			-11
    		],
    		[
    			-37,
    			-45
    		],
    		[
    			2,
    			-20
    		],
    		[
    			-33,
    			-66
    		],
    		[
    			-38,
    			-36
    		],
    		[
    			-103,
    			68
    		],
    		[
    			-55,
    			18
    		],
    		[
    			-27,
    			64
    		],
    		[
    			22,
    			180
    		],
    		[
    			-13,
    			51
    		],
    		[
    			-31,
    			67
    		],
    		[
    			-21,
    			88
    		],
    		[
    			-38,
    			37
    		],
    		[
    			-19,
    			58
    		]
    	],
    	[
    		[
    			8856,
    			1873
    		],
    		[
    			24,
    			69
    		],
    		[
    			15,
    			15
    		],
    		[
    			56,
    			-8
    		],
    		[
    			55,
    			-90
    		],
    		[
    			66,
    			14
    		],
    		[
    			43,
    			24
    		],
    		[
    			56,
    			-9
    		],
    		[
    			50,
    			-54
    		],
    		[
    			25,
    			-5
    		],
    		[
    			15,
    			-28
    		],
    		[
    			70,
    			-21
    		],
    		[
    			16,
    			-18
    		],
    		[
    			1,
    			-41
    		],
    		[
    			-43,
    			-54
    		],
    		[
    			-45,
    			-10
    		],
    		[
    			-19,
    			-17
    		],
    		[
    			-36,
    			8
    		],
    		[
    			-75,
    			-36
    		],
    		[
    			-51,
    			-6
    		],
    		[
    			-46,
    			23
    		],
    		[
    			-5,
    			92
    		],
    		[
    			-9,
    			44
    		],
    		[
    			-31,
    			13
    		],
    		[
    			-22,
    			-16
    		],
    		[
    			-56,
    			26
    		],
    		[
    			-38,
    			42
    		],
    		[
    			-16,
    			43
    		]
    	],
    	[
    		[
    			8854,
    			1569
    		],
    		[
    			15,
    			21
    		],
    		[
    			76,
    			38
    		],
    		[
    			20,
    			-21
    		],
    		[
    			-20,
    			-47
    		],
    		[
    			-77,
    			-10
    		],
    		[
    			-14,
    			19
    		]
    	],
    	[
    		[
    			8606,
    			1862
    		],
    		[
    			51,
    			21
    		],
    		[
    			72,
    			-19
    		],
    		[
    			52,
    			-65
    		],
    		[
    			-16,
    			-43
    		],
    		[
    			-42,
    			-25
    		],
    		[
    			-50,
    			-2
    		],
    		[
    			-20,
    			43
    		],
    		[
    			-10,
    			49
    		],
    		[
    			-30,
    			17
    		],
    		[
    			-7,
    			24
    		]
    	],
    	[
    		[
    			8437,
    			2025
    		],
    		[
    			39,
    			54
    		],
    		[
    			8,
    			31
    		],
    		[
    			36,
    			-11
    		],
    		[
    			220,
    			-34
    		],
    		[
    			43,
    			11
    		],
    		[
    			45,
    			-2
    		],
    		[
    			18,
    			-23
    		],
    		[
    			-62,
    			-60
    		],
    		[
    			-50,
    			-17
    		],
    		[
    			-152,
    			46
    		],
    		[
    			-36,
    			-9
    		],
    		[
    			-72,
    			-3
    		],
    		[
    			-37,
    			17
    		]
    	],
    	[
    		[
    			7774,
    			2398
    		],
    		[
    			106,
    			3
    		],
    		[
    			79,
    			91
    		],
    		[
    			28,
    			8
    		],
    		[
    			35,
    			-50
    		],
    		[
    			-2,
    			-16
    		],
    		[
    			29,
    			-53
    		],
    		[
    			25,
    			-81
    		],
    		[
    			52,
    			-15
    		],
    		[
    			38,
    			-45
    		],
    		[
    			8,
    			-38
    		],
    		[
    			30,
    			-26
    		],
    		[
    			-100,
    			-32
    		],
    		[
    			-62,
    			39
    		],
    		[
    			-63,
    			8
    		],
    		[
    			-49,
    			-11
    		],
    		[
    			-43,
    			1
    		],
    		[
    			-19,
    			58
    		],
    		[
    			-61,
    			84
    		],
    		[
    			0,
    			43
    		],
    		[
    			-31,
    			32
    		]
    	],
    	[
    		[
    			6746,
    			2770
    		],
    		[
    			3,
    			27
    		],
    		[
    			27,
    			25
    		],
    		[
    			11,
    			33
    		],
    		[
    			50,
    			25
    		],
    		[
    			53,
    			39
    		],
    		[
    			43,
    			-11
    		],
    		[
    			21,
    			14
    		],
    		[
    			55,
    			-4
    		],
    		[
    			45,
    			-14
    		],
    		[
    			31,
    			-51
    		],
    		[
    			-2,
    			-31
    		],
    		[
    			-26,
    			-42
    		],
    		[
    			1,
    			-71
    		],
    		[
    			-12,
    			-18
    		],
    		[
    			-68,
    			-52
    		],
    		[
    			-111,
    			27
    		],
    		[
    			-41,
    			43
    		],
    		[
    			-61,
    			21
    		],
    		[
    			-19,
    			40
    		]
    	],
    	[
    		[
    			6429,
    			2621
    		],
    		[
    			16,
    			47
    		],
    		[
    			27,
    			26
    		],
    		[
    			42,
    			22
    		],
    		[
    			10,
    			31
    		],
    		[
    			40,
    			-2
    		],
    		[
    			-21,
    			-50
    		],
    		[
    			5,
    			-26
    		],
    		[
    			-58,
    			-22
    		],
    		[
    			-32,
    			-66
    		],
    		[
    			-29,
    			40
    		]
    	],
    	[
    		[
    			27077,
    			12552
    		],
    		[
    			-22,
    			-21
    		],
    		[
    			-49,
    			-165
    		],
    		[
    			33,
    			-21
    		],
    		[
    			-4,
    			-68
    		],
    		[
    			76,
    			-90
    		],
    		[
    			36,
    			-18
    		],
    		[
    			24,
    			-34
    		],
    		[
    			19,
    			-55
    		],
    		[
    			-4,
    			-32
    		],
    		[
    			25,
    			-71
    		],
    		[
    			37,
    			-22
    		],
    		[
    			25,
    			-37
    		],
    		[
    			12,
    			-41
    		],
    		[
    			81,
    			-67
    		],
    		[
    			66,
    			-13
    		],
    		[
    			27,
    			-83
    		],
    		[
    			43,
    			-160
    		]
    	],
    	[
    		[
    			29101,
    			14456
    		],
    		[
    			-34,
    			-21
    		],
    		[
    			-32,
    			-1
    		],
    		[
    			-34,
    			-23
    		],
    		[
    			-15,
    			29
    		],
    		[
    			11,
    			90
    		],
    		[
    			30,
    			50
    		]
    	],
    	[
    		[
    			28741,
    			14210
    		],
    		[
    			13,
    			21
    		],
    		[
    			-19,
    			47
    		],
    		[
    			22,
    			15
    		],
    		[
    			-39,
    			184
    		],
    		[
    			-72,
    			268
    		]
    	],
    	[
    		[
    			29005,
    			14603
    		],
    		[
    			-6,
    			-43
    		],
    		[
    			-27,
    			-8
    		],
    		[
    			-13,
    			47
    		],
    		[
    			-27,
    			-22
    		],
    		[
    			-15,
    			-38
    		],
    		[
    			16,
    			-56
    		],
    		[
    			15,
    			-91
    		],
    		[
    			-13,
    			-36
    		],
    		[
    			-3,
    			-51
    		],
    		[
    			-69,
    			-27
    		],
    		[
    			-47,
    			-39
    		],
    		[
    			-65,
    			-34
    		],
    		[
    			-10,
    			5
    		]
    	],
    	[
    		[
    			20203,
    			9838
    		],
    		[
    			50,
    			-14
    		],
    		[
    			20,
    			27
    		],
    		[
    			-24,
    			64
    		],
    		[
    			17,
    			29
    		],
    		[
    			24,
    			-6
    		],
    		[
    			22,
    			-28
    		],
    		[
    			38,
    			15
    		],
    		[
    			56,
    			7
    		],
    		[
    			0,
    			-51
    		],
    		[
    			33,
    			5
    		],
    		[
    			12,
    			43
    		],
    		[
    			-25,
    			28
    		],
    		[
    			11,
    			40
    		],
    		[
    			56,
    			-46
    		],
    		[
    			40,
    			33
    		],
    		[
    			31,
    			-2
    		],
    		[
    			101,
    			-60
    		],
    		[
    			32,
    			-3
    		],
    		[
    			24,
    			-42
    		],
    		[
    			34,
    			16
    		],
    		[
    			7,
    			74
    		],
    		[
    			36,
    			32
    		],
    		[
    			30,
    			7
    		],
    		[
    			36,
    			46
    		],
    		[
    			35,
    			5
    		],
    		[
    			31,
    			-58
    		],
    		[
    			37,
    			4
    		],
    		[
    			54,
    			-30
    		],
    		[
    			1,
    			43
    		],
    		[
    			32,
    			0
    		],
    		[
    			0,
    			100
    		],
    		[
    			37,
    			10
    		],
    		[
    			8,
    			29
    		],
    		[
    			30,
    			39
    		],
    		[
    			11,
    			52
    		],
    		[
    			37,
    			-25
    		],
    		[
    			19,
    			-79
    		],
    		[
    			56,
    			-31
    		],
    		[
    			27,
    			8
    		],
    		[
    			61,
    			-10
    		],
    		[
    			55,
    			27
    		],
    		[
    			6,
    			55
    		],
    		[
    			-6,
    			67
    		],
    		[
    			58,
    			98
    		],
    		[
    			28,
    			-14
    		],
    		[
    			44,
    			50
    		],
    		[
    			13,
    			83
    		],
    		[
    			16,
    			21
    		],
    		[
    			49,
    			20
    		],
    		[
    			39,
    			81
    		],
    		[
    			-32,
    			90
    		],
    		[
    			7,
    			38
    		],
    		[
    			73,
    			19
    		],
    		[
    			34,
    			-3
    		],
    		[
    			22,
    			-27
    		],
    		[
    			43,
    			10
    		],
    		[
    			75,
    			71
    		],
    		[
    			58,
    			20
    		],
    		[
    			43,
    			4
    		],
    		[
    			-14,
    			29
    		],
    		[
    			21,
    			29
    		],
    		[
    			-9,
    			20
    		],
    		[
    			-40,
    			3
    		],
    		[
    			14,
    			47
    		],
    		[
    			-3,
    			24
    		],
    		[
    			-40,
    			47
    		],
    		[
    			39,
    			47
    		]
    	],
    	[
    		[
    			21933,
    			11065
    		],
    		[
    			33,
    			37
    		],
    		[
    			75,
    			-47
    		],
    		[
    			68,
    			23
    		],
    		[
    			20,
    			24
    		],
    		[
    			23,
    			-18
    		],
    		[
    			5,
    			-28
    		],
    		[
    			41,
    			-9
    		],
    		[
    			34,
    			-23
    		],
    		[
    			14,
    			-38
    		],
    		[
    			36,
    			-46
    		],
    		[
    			21,
    			-67
    		],
    		[
    			83,
    			-17
    		],
    		[
    			51,
    			20
    		],
    		[
    			70,
    			-14
    		],
    		[
    			14,
    			-26
    		],
    		[
    			35,
    			-16
    		],
    		[
    			10,
    			-29
    		],
    		[
    			62,
    			-15
    		],
    		[
    			18,
    			43
    		],
    		[
    			58,
    			27
    		],
    		[
    			32,
    			-17
    		],
    		[
    			59,
    			-5
    		],
    		[
    			47,
    			-43
    		],
    		[
    			28,
    			29
    		],
    		[
    			55,
    			6
    		],
    		[
    			18,
    			44
    		],
    		[
    			34,
    			42
    		],
    		[
    			30,
    			6
    		],
    		[
    			45,
    			31
    		],
    		[
    			17,
    			-20
    		],
    		[
    			27,
    			-102
    		],
    		[
    			30,
    			-21
    		],
    		[
    			43,
    			2
    		],
    		[
    			44,
    			-42
    		],
    		[
    			27,
    			-14
    		],
    		[
    			17,
    			-40
    		]
    	],
    	[
    		[
    			22446,
    			13229
    		],
    		[
    			-1,
    			-30
    		],
    		[
    			60,
    			2
    		],
    		[
    			7,
    			16
    		],
    		[
    			59,
    			-36
    		],
    		[
    			98,
    			-30
    		],
    		[
    			60,
    			-48
    		],
    		[
    			32,
    			-2
    		],
    		[
    			22,
    			18
    		],
    		[
    			13,
    			45
    		],
    		[
    			32,
    			-33
    		],
    		[
    			35,
    			-18
    		],
    		[
    			-122,
    			-37
    		],
    		[
    			-5,
    			-32
    		],
    		[
    			19,
    			-20
    		],
    		[
    			43,
    			23
    		],
    		[
    			22,
    			26
    		],
    		[
    			34,
    			-15
    		],
    		[
    			28,
    			20
    		],
    		[
    			45,
    			-26
    		],
    		[
    			83,
    			-21
    		],
    		[
    			58,
    			47
    		],
    		[
    			59,
    			14
    		],
    		[
    			38,
    			35
    		],
    		[
    			85,
    			49
    		],
    		[
    			77,
    			-14
    		],
    		[
    			50,
    			18
    		],
    		[
    			21,
    			-3
    		],
    		[
    			71,
    			70
    		],
    		[
    			72,
    			103
    		],
    		[
    			74,
    			81
    		],
    		[
    			32,
    			11
    		],
    		[
    			56,
    			49
    		],
    		[
    			55,
    			38
    		],
    		[
    			53,
    			22
    		],
    		[
    			193,
    			120
    		]
    	],
    	[
    		[
    			21933,
    			11065
    		],
    		[
    			-58,
    			557
    		],
    		[
    			-38,
    			391
    		],
    		[
    			-42,
    			385
    		],
    		[
    			-80,
    			704
    		]
    	],
    	[
    		[
    			20288,
    			15840
    		],
    		[
    			3,
    			48
    		],
    		[
    			62,
    			-1
    		],
    		[
    			-17,
    			-57
    		],
    		[
    			-31,
    			-8
    		],
    		[
    			-17,
    			18
    		]
    	],
    	[
    		[
    			18311,
    			16912
    		],
    		[
    			8,
    			16
    		],
    		[
    			53,
    			24
    		],
    		[
    			4,
    			-28
    		],
    		[
    			-57,
    			-24
    		],
    		[
    			-8,
    			12
    		]
    	],
    	[
    		[
    			18247,
    			16800
    		],
    		[
    			29,
    			14
    		],
    		[
    			56,
    			62
    		],
    		[
    			24,
    			-18
    		],
    		[
    			-51,
    			-27
    		],
    		[
    			-47,
    			-55
    		],
    		[
    			-11,
    			24
    		]
    	],
    	[
    		[
    			17629,
    			16707
    		],
    		[
    			37,
    			-19
    		],
    		[
    			77,
    			15
    		],
    		[
    			108,
    			54
    		],
    		[
    			32,
    			2
    		],
    		[
    			71,
    			32
    		],
    		[
    			15,
    			20
    		],
    		[
    			120,
    			40
    		],
    		[
    			64,
    			68
    		],
    		[
    			17,
    			-8
    		],
    		[
    			33,
    			26
    		],
    		[
    			38,
    			-20
    		],
    		[
    			22,
    			-31
    		],
    		[
    			-21,
    			-56
    		],
    		[
    			-41,
    			-55
    		],
    		[
    			18,
    			-43
    		],
    		[
    			-28,
    			-30
    		],
    		[
    			-17,
    			-49
    		],
    		[
    			17,
    			-14
    		],
    		[
    			110,
    			70
    		],
    		[
    			58,
    			-47
    		],
    		[
    			87,
    			-21
    		]
    	],
    	[
    		[
    			19977,
    			15604
    		],
    		[
    			-14,
    			-41
    		],
    		[
    			2,
    			-53
    		],
    		[
    			-71,
    			-16
    		],
    		[
    			-26,
    			-14
    		],
    		[
    			-1,
    			-44
    		],
    		[
    			-16,
    			-45
    		],
    		[
    			-18,
    			-11
    		],
    		[
    			-13,
    			-50
    		],
    		[
    			-23,
    			-38
    		],
    		[
    			-4,
    			-82
    		],
    		[
    			-11,
    			-47
    		],
    		[
    			33,
    			-20
    		],
    		[
    			22,
    			7
    		],
    		[
    			33,
    			69
    		],
    		[
    			46,
    			22
    		],
    		[
    			21,
    			46
    		],
    		[
    			-3,
    			21
    		],
    		[
    			50,
    			94
    		],
    		[
    			92,
    			44
    		],
    		[
    			45,
    			127
    		],
    		[
    			28,
    			41
    		],
    		[
    			7,
    			66
    		],
    		[
    			22,
    			-3
    		],
    		[
    			23,
    			25
    		],
    		[
    			15,
    			53
    		],
    		[
    			55,
    			38
    		],
    		[
    			14,
    			-62
    		],
    		[
    			-26,
    			-6
    		],
    		[
    			0,
    			-94
    		],
    		[
    			-37,
    			-26
    		],
    		[
    			-5,
    			-43
    		],
    		[
    			-23,
    			-37
    		],
    		[
    			11,
    			-31
    		],
    		[
    			-12,
    			-42
    		],
    		[
    			-28,
    			-22
    		],
    		[
    			-26,
    			-52
    		],
    		[
    			-8,
    			-56
    		],
    		[
    			-21,
    			-64
    		],
    		[
    			-21,
    			-30
    		],
    		[
    			-18,
    			-76
    		],
    		[
    			-8,
    			-108
    		],
    		[
    			-11,
    			-44
    		],
    		[
    			25,
    			-70
    		],
    		[
    			-3,
    			-40
    		],
    		[
    			-20,
    			-30
    		],
    		[
    			-41,
    			-35
    		],
    		[
    			-33,
    			-180
    		],
    		[
    			9,
    			-55
    		],
    		[
    			20,
    			-36
    		],
    		[
    			1,
    			-59
    		],
    		[
    			-38,
    			-102
    		],
    		[
    			-1,
    			-79
    		],
    		[
    			-28,
    			-58
    		],
    		[
    			-16,
    			-115
    		],
    		[
    			21,
    			-61
    		],
    		[
    			-8,
    			-30
    		],
    		[
    			24,
    			-48
    		],
    		[
    			-15,
    			-41
    		],
    		[
    			28,
    			-37
    		],
    		[
    			10,
    			-76
    		],
    		[
    			13,
    			-29
    		],
    		[
    			39,
    			-38
    		],
    		[
    			-23,
    			-119
    		],
    		[
    			17,
    			-111
    		]
    	],
    	[
    		[
    			18153,
    			14211
    		],
    		[
    			-16,
    			37
    		],
    		[
    			5,
    			26
    		],
    		[
    			-21,
    			26
    		],
    		[
    			-3,
    			74
    		],
    		[
    			10,
    			52
    		],
    		[
    			-24,
    			56
    		],
    		[
    			-45,
    			66
    		],
    		[
    			-43,
    			51
    		],
    		[
    			-76,
    			16
    		],
    		[
    			-34,
    			27
    		],
    		[
    			-37,
    			43
    		],
    		[
    			-57,
    			32
    		],
    		[
    			-32,
    			27
    		],
    		[
    			-31,
    			104
    		],
    		[
    			-69,
    			50
    		],
    		[
    			-86,
    			25
    		],
    		[
    			-34,
    			27
    		],
    		[
    			-21,
    			50
    		],
    		[
    			-18,
    			14
    		],
    		[
    			-90,
    			10
    		],
    		[
    			-55,
    			30
    		],
    		[
    			-1,
    			19
    		],
    		[
    			-63,
    			59
    		],
    		[
    			-38,
    			25
    		],
    		[
    			21,
    			72
    		],
    		[
    			-7,
    			40
    		],
    		[
    			12,
    			36
    		],
    		[
    			-10,
    			71
    		],
    		[
    			-15,
    			40
    		],
    		[
    			23,
    			23
    		],
    		[
    			-13,
    			60
    		],
    		[
    			7,
    			27
    		],
    		[
    			-5,
    			56
    		],
    		[
    			29,
    			37
    		],
    		[
    			24,
    			50
    		],
    		[
    			1,
    			34
    		],
    		[
    			-67,
    			96
    		],
    		[
    			-59,
    			4
    		],
    		[
    			-4,
    			50
    		],
    		[
    			8,
    			62
    		],
    		[
    			42,
    			38
    		],
    		[
    			37,
    			104
    		],
    		[
    			33,
    			31
    		],
    		[
    			45,
    			17
    		],
    		[
    			15,
    			26
    		],
    		[
    			30,
    			-5
    		],
    		[
    			21,
    			40
    		],
    		[
    			30,
    			-9
    		],
    		[
    			16,
    			42
    		],
    		[
    			17,
    			7
    		],
    		[
    			-16,
    			463
    		],
    		[
    			41,
    			-11
    		],
    		[
    			32,
    			53
    		],
    		[
    			28,
    			28
    		],
    		[
    			39,
    			-32
    		]
    	],
    	[
    		[
    			458,
    			15372
    		],
    		[
    			-34,
    			56
    		],
    		[
    			-16,
    			59
    		],
    		[
    			12,
    			48
    		],
    		[
    			-11,
    			62
    		],
    		[
    			28,
    			145
    		],
    		[
    			54,
    			96
    		],
    		[
    			6,
    			67
    		],
    		[
    			-15,
    			66
    		],
    		[
    			-18,
    			17
    		],
    		[
    			-4,
    			74
    		],
    		[
    			66,
    			76
    		],
    		[
    			35,
    			54
    		],
    		[
    			85,
    			169
    		],
    		[
    			-3,
    			31
    		],
    		[
    			34,
    			19
    		],
    		[
    			54,
    			60
    		],
    		[
    			55,
    			85
    		],
    		[
    			86,
    			176
    		],
    		[
    			86,
    			216
    		],
    		[
    			42,
    			118
    		],
    		[
    			48,
    			120
    		],
    		[
    			16,
    			53
    		],
    		[
    			46,
    			115
    		],
    		[
    			17,
    			57
    		],
    		[
    			5,
    			50
    		],
    		[
    			43,
    			71
    		],
    		[
    			36,
    			83
    		],
    		[
    			12,
    			46
    		],
    		[
    			33,
    			46
    		],
    		[
    			42,
    			127
    		],
    		[
    			-1,
    			25
    		],
    		[
    			27,
    			60
    		],
    		[
    			1,
    			30
    		],
    		[
    			29,
    			54
    		],
    		[
    			29,
    			87
    		],
    		[
    			13,
    			54
    		],
    		[
    			-11,
    			32
    		],
    		[
    			25,
    			48
    		],
    		[
    			12,
    			54
    		],
    		[
    			-4,
    			33
    		],
    		[
    			34,
    			15
    		],
    		[
    			22,
    			70
    		],
    		[
    			1,
    			79
    		],
    		[
    			10,
    			33
    		],
    		[
    			46,
    			-60
    		],
    		[
    			23,
    			19
    		],
    		[
    			36,
    			7
    		],
    		[
    			15,
    			-24
    		],
    		[
    			54,
    			4
    		],
    		[
    			44,
    			22
    		]
    	],
    	[
    		[
    			11659,
    			18628
    		],
    		[
    			222,
    			-20
    		],
    		[
    			321,
    			-27
    		],
    		[
    			356,
    			-27
    		],
    		[
    			532,
    			-33
    		],
    		[
    			398,
    			-21
    		],
    		[
    			460,
    			-20
    		],
    		[
    			573,
    			-17
    		],
    		[
    			480,
    			-9
    		]
    	],
    	[
    		[
    			15001,
    			18454
    		],
    		[
    			-3,
    			-41
    		],
    		[
    			21,
    			-42
    		],
    		[
    			2,
    			-47
    		],
    		[
    			20,
    			-75
    		],
    		[
    			20,
    			-44
    		],
    		[
    			-22,
    			-64
    		],
    		[
    			-8,
    			-91
    		],
    		[
    			15,
    			-16
    		],
    		[
    			-15,
    			-58
    		],
    		[
    			9,
    			-58
    		],
    		[
    			-6,
    			-130
    		],
    		[
    			34,
    			-72
    		],
    		[
    			10,
    			-83
    		],
    		[
    			18,
    			-21
    		],
    		[
    			-2,
    			-37
    		],
    		[
    			80,
    			-205
    		],
    		[
    			4,
    			-88
    		],
    		[
    			-7,
    			-65
    		],
    		[
    			14,
    			-84
    		],
    		[
    			-7,
    			-26
    		],
    		[
    			10,
    			-78
    		],
    		[
    			3,
    			-100
    		],
    		[
    			-9,
    			-28
    		],
    		[
    			21,
    			-64
    		],
    		[
    			4,
    			-45
    		],
    		[
    			-8,
    			-73
    		],
    		[
    			11,
    			-8
    		],
    		[
    			-12,
    			-89
    		],
    		[
    			26,
    			-61
    		],
    		[
    			13,
    			-107
    		],
    		[
    			27,
    			-51
    		],
    		[
    			33,
    			-36
    		],
    		[
    			4,
    			-113
    		],
    		[
    			18,
    			-79
    		],
    		[
    			-12,
    			-45
    		],
    		[
    			7,
    			-72
    		]
    	],
    	[
    		[
    			20235,
    			12947
    		],
    		[
    			54,
    			-42
    		],
    		[
    			36,
    			-11
    		],
    		[
    			81,
    			3
    		],
    		[
    			64,
    			28
    		],
    		[
    			92,
    			58
    		],
    		[
    			50,
    			43
    		]
    	],
    	[
    		[
    			15001,
    			18454
    		],
    		[
    			500,
    			-5
    		],
    		[
    			518,
    			1
    		],
    		[
    			-2,
    			299
    		],
    		[
    			46,
    			-23
    		],
    		[
    			50,
    			13
    		],
    		[
    			50,
    			-35
    		],
    		[
    			15,
    			-23
    		],
    		[
    			27,
    			-134
    		],
    		[
    			11,
    			-16
    		],
    		[
    			35,
    			-167
    		],
    		[
    			-10,
    			-46
    		],
    		[
    			6,
    			-33
    		],
    		[
    			52,
    			-49
    		],
    		[
    			75,
    			-17
    		],
    		[
    			11,
    			13
    		],
    		[
    			74,
    			-8
    		],
    		[
    			11,
    			-35
    		],
    		[
    			117,
    			-6
    		],
    		[
    			81,
    			-9
    		],
    		[
    			20,
    			-45
    		],
    		[
    			6,
    			-42
    		],
    		[
    			74,
    			3
    		],
    		[
    			87,
    			24
    		],
    		[
    			1,
    			36
    		],
    		[
    			57,
    			29
    		],
    		[
    			69,
    			14
    		],
    		[
    			14,
    			-14
    		],
    		[
    			96,
    			3
    		],
    		[
    			129,
    			-61
    		],
    		[
    			45,
    			5
    		],
    		[
    			1,
    			-34
    		],
    		[
    			-31,
    			-5
    		],
    		[
    			-6,
    			-25
    		],
    		[
    			29,
    			-19
    		],
    		[
    			73,
    			11
    		],
    		[
    			27,
    			-35
    		],
    		[
    			-6,
    			-39
    		],
    		[
    			28,
    			-42
    		],
    		[
    			26,
    			-58
    		],
    		[
    			43,
    			21
    		],
    		[
    			-12,
    			34
    		],
    		[
    			5,
    			42
    		],
    		[
    			41,
    			4
    		],
    		[
    			21,
    			15
    		],
    		[
    			39,
    			-6
    		],
    		[
    			43,
    			-24
    		],
    		[
    			-2,
    			-43
    		],
    		[
    			57,
    			-19
    		],
    		[
    			16,
    			-23
    		],
    		[
    			74,
    			-3
    		],
    		[
    			4,
    			-66
    		],
    		[
    			72,
    			-13
    		],
    		[
    			3,
    			-38
    		],
    		[
    			38,
    			21
    		],
    		[
    			30,
    			-14
    		],
    		[
    			28,
    			18
    		],
    		[
    			60,
    			14
    		],
    		[
    			79,
    			80
    		],
    		[
    			96,
    			56
    		],
    		[
    			23,
    			-4
    		],
    		[
    			6,
    			-50
    		],
    		[
    			38,
    			-57
    		],
    		[
    			60,
    			8
    		],
    		[
    			129,
    			-1
    		],
    		[
    			37,
    			12
    		],
    		[
    			86,
    			11
    		],
    		[
    			55,
    			-18
    		],
    		[
    			18,
    			-42
    		],
    		[
    			50,
    			-29
    		],
    		[
    			79,
    			33
    		],
    		[
    			60,
    			-16
    		],
    		[
    			-38,
    			-46
    		],
    		[
    			-45,
    			-42
    		],
    		[
    			-64,
    			-27
    		],
    		[
    			-23,
    			-27
    		],
    		[
    			-92,
    			-35
    		],
    		[
    			-88,
    			-43
    		],
    		[
    			-24,
    			-5
    		],
    		[
    			-72,
    			-34
    		],
    		[
    			-92,
    			-64
    		],
    		[
    			-65,
    			-57
    		],
    		[
    			-127,
    			-133
    		],
    		[
    			-56,
    			-93
    		],
    		[
    			-37,
    			-37
    		],
    		[
    			-65,
    			-85
    		],
    		[
    			-55,
    			-38
    		],
    		[
    			-41,
    			-60
    		],
    		[
    			-22,
    			-9
    		],
    		[
    			-36,
    			-50
    		],
    		[
    			-31,
    			-16
    		],
    		[
    			-124,
    			-113
    		],
    		[
    			43,
    			-62
    		]
    	],
    	[
    		[
    			28741,
    			14210
    		],
    		[
    			-12,
    			9
    		],
    		[
    			-53,
    			-19
    		],
    		[
    			-77,
    			-46
    		],
    		[
    			-127,
    			-66
    		],
    		[
    			-38,
    			4
    		],
    		[
    			-44,
    			-37
    		],
    		[
    			-43,
    			8
    		],
    		[
    			-59,
    			-30
    		],
    		[
    			-52,
    			-7
    		],
    		[
    			-25,
    			-23
    		],
    		[
    			-18,
    			18
    		],
    		[
    			-27,
    			-23
    		],
    		[
    			-19,
    			-43
    		],
    		[
    			-20,
    			-1
    		],
    		[
    			-32,
    			-60
    		],
    		[
    			-41,
    			-2
    		],
    		[
    			-25,
    			-39
    		],
    		[
    			-15,
    			5
    		],
    		[
    			-54,
    			-49
    		],
    		[
    			-12,
    			-27
    		],
    		[
    			-31,
    			-14
    		],
    		[
    			-49,
    			-39
    		],
    		[
    			-28,
    			-32
    		]
    	]
    ];
    var transform$1 = {
    	scale: [
    		150.99475068308828,
    		141.5355037985413
    	],
    	translate: [
    		-2356113.7428814615,
    		-1329804.2429657409
    	]
    };
    var objects = {
    	states: {
    		type: "GeometryCollection",
    		geometries: [
    			{
    				arcs: [
    					[
    						0,
    						1,
    						2,
    						3,
    						4
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "28",
    					STATENS: "01779790",
    					AFFGEOID: "0400000US28",
    					GEOID: "28",
    					STUSPS: "MS",
    					NAME: "Mississippi",
    					LSAD: "00",
    					ALAND: 121533519481,
    					AWATER: 3926919758,
    					Admin_Per_100K: 33677,
    					Admin_Per_100k_18Plus: 43973,
    					Admin_Per_100k_65Plus: 100914,
    					Administered_18Plus: 1001506,
    					Administered_65Plus: 491141,
    					Administered_Dose1_Pop_Pct: 22,
    					Administered_Dose1_Recip: 655574,
    					Administered_Dose1_Recip_18Plus: 654922,
    					Administered_Dose1_Recip_18PlusPop_Pct: 28.8,
    					Administered_Dose1_Recip_65Plus: 302197,
    					Administered_Dose1_Recip_65PlusPop_Pct: 62.1,
    					Administered_Dose2_Pop_Pct: 11.7,
    					Administered_Dose2_Recip: 347813,
    					Administered_Dose2_Recip_18Plus: 347690,
    					Administered_Dose2_Recip_18PlusPop_Pct: 15.3,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 21777,
    					Administered_Moderna: 520202,
    					Administered_Pfizer: 459584,
    					Administered_Unk_Manuf: 729,
    					Census2019: 2976149,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 47661,
    					Distributed_Janssen: 37100,
    					Distributed_Moderna: 721300,
    					Distributed_Per_100k_18Plus: 62280,
    					Distributed_Per_100k_65Plus: 291452,
    					Distributed_Pfizer: 660075,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 1002292,
    					Doses_Distributed: 1418475,
    					LongName: "Mississippi",
    					Series_Complete_18Plus: 368839,
    					Series_Complete_18PlusPop_Pct: 16.2,
    					Series_Complete_65Plus: 200398,
    					Series_Complete_65PlusPop_Pct: 41.2,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 21155,
    					Series_Complete_Janssen_18Plus: 21149,
    					Series_Complete_Janssen_65Plus: 6455,
    					Series_Complete_Moderna: 181352,
    					Series_Complete_Moderna_18Plus: 181330,
    					Series_Complete_Moderna_65Plus: 105043,
    					Series_Complete_Pfizer: 166449,
    					Series_Complete_Pfizer_18Plus: 166348,
    					Series_Complete_Pfizer_65Plus: 88896,
    					Series_Complete_Pop_Pct: 12.4,
    					Series_Complete_Unk_Manuf: 12,
    					Series_Complete_Unk_Manuf_18Plus: 12,
    					Series_Complete_Unk_Manuf_65Plus: 4,
    					Series_Complete_Yes: 368968,
    					ShortName: "MSA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						[
    							5
    						]
    					],
    					[
    						[
    							6
    						]
    					],
    					[
    						[
    							7
    						]
    					],
    					[
    						[
    							8,
    							9,
    							10,
    							11,
    							12
    						]
    					]
    				],
    				type: "MultiPolygon",
    				properties: {
    					STATEFP: "37",
    					STATENS: "01027616",
    					AFFGEOID: "0400000US37",
    					GEOID: "37",
    					STUSPS: "NC",
    					NAME: "North Carolina",
    					LSAD: "00",
    					ALAND: 125923656064,
    					AWATER: 13466071395,
    					Admin_Per_100K: 38749,
    					Admin_Per_100k_18Plus: 49514,
    					Admin_Per_100k_65Plus: 122754,
    					Administered_18Plus: 4053882,
    					Administered_65Plus: 2149535,
    					Administered_Dose1_Pop_Pct: 25.3,
    					Administered_Dose1_Recip: 2649588,
    					Administered_Dose1_Recip_18Plus: 2640505,
    					Administered_Dose1_Recip_18PlusPop_Pct: 32.3,
    					Administered_Dose1_Recip_65Plus: 1217394,
    					Administered_Dose1_Recip_65PlusPop_Pct: 69.5,
    					Administered_Dose2_Pop_Pct: 12.9,
    					Administered_Dose2_Recip: 1356787,
    					Administered_Dose2_Recip_18Plus: 1355725,
    					Administered_Dose2_Recip_18PlusPop_Pct: 16.6,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 105576,
    					Administered_Moderna: 1747405,
    					Administered_Pfizer: 2210759,
    					Administered_Unk_Manuf: 329,
    					Census2019: 10488084,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 47033,
    					Distributed_Janssen: 127100,
    					Distributed_Moderna: 2314000,
    					Distributed_Per_100k_18Plus: 60249,
    					Distributed_Per_100k_65Plus: 281699,
    					Distributed_Pfizer: 2491710,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 4064069,
    					Doses_Distributed: 4932810,
    					LongName: "North Carolina",
    					Series_Complete_18Plus: 1459152,
    					Series_Complete_18PlusPop_Pct: 17.8,
    					Series_Complete_65Plus: 903472,
    					Series_Complete_65PlusPop_Pct: 51.6,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 103625,
    					Series_Complete_Janssen_18Plus: 103427,
    					Series_Complete_Janssen_65Plus: 15051,
    					Series_Complete_Moderna: 553430,
    					Series_Complete_Moderna_18Plus: 553304,
    					Series_Complete_Moderna_65Plus: 407514,
    					Series_Complete_Pfizer: 803332,
    					Series_Complete_Pfizer_18Plus: 802396,
    					Series_Complete_Pfizer_65Plus: 480888,
    					Series_Complete_Pop_Pct: 13.9,
    					Series_Complete_Unk_Manuf: 25,
    					Series_Complete_Unk_Manuf_18Plus: 25,
    					Series_Complete_Unk_Manuf_65Plus: 19,
    					Series_Complete_Yes: 1460412,
    					ShortName: "NCA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						13,
    						14,
    						15,
    						16,
    						17,
    						18
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "40",
    					STATENS: "01102857",
    					AFFGEOID: "0400000US40",
    					GEOID: "40",
    					STUSPS: "OK",
    					NAME: "Oklahoma",
    					LSAD: "00",
    					ALAND: 177662925723,
    					AWATER: 3374587997,
    					Admin_Per_100K: 42319,
    					Admin_Per_100k_18Plus: 55511,
    					Admin_Per_100k_65Plus: 122265,
    					Administered_18Plus: 1667972,
    					Administered_65Plus: 776545,
    					Administered_Dose1_Pop_Pct: 27.3,
    					Administered_Dose1_Recip: 1081578,
    					Administered_Dose1_Recip_18Plus: 1075841,
    					Administered_Dose1_Recip_18PlusPop_Pct: 35.8,
    					Administered_Dose1_Recip_65Plus: 449548,
    					Administered_Dose1_Recip_65PlusPop_Pct: 70.8,
    					Administered_Dose2_Pop_Pct: 14.3,
    					Administered_Dose2_Recip: 565412,
    					Administered_Dose2_Recip_18Plus: 564782,
    					Administered_Dose2_Recip_18PlusPop_Pct: 18.8,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 21267,
    					Administered_Moderna: 780994,
    					Administered_Pfizer: 872285,
    					Administered_Unk_Manuf: 10,
    					Census2019: 3956971,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 56589,
    					Distributed_Janssen: 56100,
    					Distributed_Moderna: 1102600,
    					Distributed_Per_100k_18Plus: 74522,
    					Distributed_Per_100k_65Plus: 352556,
    					Distributed_Pfizer: 1080495,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 1674556,
    					Doses_Distributed: 2239195,
    					LongName: "Oklahoma",
    					Series_Complete_18Plus: 585923,
    					Series_Complete_18PlusPop_Pct: 19.5,
    					Series_Complete_65Plus: 324460,
    					Series_Complete_65PlusPop_Pct: 51.1,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 21147,
    					Series_Complete_Janssen_18Plus: 21141,
    					Series_Complete_Janssen_65Plus: 5292,
    					Series_Complete_Moderna: 255976,
    					Series_Complete_Moderna_18Plus: 255960,
    					Series_Complete_Moderna_65Plus: 169050,
    					Series_Complete_Pfizer: 309435,
    					Series_Complete_Pfizer_18Plus: 308821,
    					Series_Complete_Pfizer_65Plus: 150118,
    					Series_Complete_Pop_Pct: 14.8,
    					Series_Complete_Unk_Manuf: 1,
    					Series_Complete_Unk_Manuf_18Plus: 1,
    					Series_Complete_Unk_Manuf_65Plus: 0,
    					Series_Complete_Yes: 586559,
    					ShortName: "OKA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						[
    							19,
    							20
    						]
    					],
    					[
    						[
    							21,
    							22,
    							23,
    							24,
    							25,
    							-9,
    							26,
    							27
    						]
    					]
    				],
    				type: "MultiPolygon",
    				properties: {
    					STATEFP: "51",
    					STATENS: "01779803",
    					AFFGEOID: "0400000US51",
    					GEOID: "51",
    					STUSPS: "VA",
    					NAME: "Virginia",
    					LSAD: "00",
    					ALAND: 102257717110,
    					AWATER: 8528531774,
    					Admin_Per_100K: 39369,
    					Admin_Per_100k_18Plus: 50224,
    					Admin_Per_100k_65Plus: 105703,
    					Administered_18Plus: 3352285,
    					Administered_65Plus: 1436408,
    					Administered_Dose1_Pop_Pct: 25.8,
    					Administered_Dose1_Recip: 2204874,
    					Administered_Dose1_Recip_18Plus: 2198660,
    					Administered_Dose1_Recip_18PlusPop_Pct: 32.9,
    					Administered_Dose1_Recip_65Plus: 932928,
    					Administered_Dose1_Recip_65PlusPop_Pct: 68.7,
    					Administered_Dose2_Pop_Pct: 13.4,
    					Administered_Dose2_Recip: 1141500,
    					Administered_Dose2_Recip_18Plus: 1139806,
    					Administered_Dose2_Recip_18PlusPop_Pct: 17.1,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 82863,
    					Administered_Moderna: 1547065,
    					Administered_Pfizer: 1729834,
    					Administered_Unk_Manuf: 568,
    					Census2019: 8535519,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 44755,
    					Distributed_Janssen: 98600,
    					Distributed_Moderna: 1847700,
    					Distributed_Per_100k_18Plus: 57232,
    					Distributed_Per_100k_65Plus: 281113,
    					Distributed_Pfizer: 1873755,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 3360330,
    					Doses_Distributed: 3820055,
    					LongName: "Virginia",
    					Series_Complete_18Plus: 1222067,
    					Series_Complete_18PlusPop_Pct: 18.3,
    					Series_Complete_65Plus: 532402,
    					Series_Complete_65PlusPop_Pct: 39.2,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 82387,
    					Series_Complete_Janssen_18Plus: 82261,
    					Series_Complete_Janssen_65Plus: 29311,
    					Series_Complete_Moderna: 538370,
    					Series_Complete_Moderna_18Plus: 538135,
    					Series_Complete_Moderna_65Plus: 240725,
    					Series_Complete_Pfizer: 602974,
    					Series_Complete_Pfizer_18Plus: 601515,
    					Series_Complete_Pfizer_65Plus: 262255,
    					Series_Complete_Pop_Pct: 14.3,
    					Series_Complete_Unk_Manuf: 156,
    					Series_Complete_Unk_Manuf_18Plus: 156,
    					Series_Complete_Unk_Manuf_65Plus: 111,
    					Series_Complete_Yes: 1223887,
    					ShortName: "VAA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						28,
    						29,
    						30,
    						-22,
    						31
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "54",
    					STATENS: "01779805",
    					AFFGEOID: "0400000US54",
    					GEOID: "54",
    					STUSPS: "WV",
    					NAME: "West Virginia",
    					LSAD: "00",
    					ALAND: 62266474513,
    					AWATER: 489028543,
    					Admin_Per_100K: 42681,
    					Admin_Per_100k_18Plus: 53290,
    					Admin_Per_100k_65Plus: 107156,
    					Administered_18Plus: 763419,
    					Administered_65Plus: 393274,
    					Administered_Dose1_Pop_Pct: 26.5,
    					Administered_Dose1_Recip: 474100,
    					Administered_Dose1_Recip_18Plus: 472922,
    					Administered_Dose1_Recip_18PlusPop_Pct: 33,
    					Administered_Dose1_Recip_65Plus: 231503,
    					Administered_Dose1_Recip_65PlusPop_Pct: 63.1,
    					Administered_Dose2_Pop_Pct: 15.8,
    					Administered_Dose2_Recip: 282409,
    					Administered_Dose2_Recip_18Plus: 282134,
    					Administered_Dose2_Recip_18PlusPop_Pct: 19.7,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 3553,
    					Administered_Moderna: 383951,
    					Administered_Pfizer: 377399,
    					Administered_Unk_Manuf: 0,
    					Census2019: 1792147,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 52424,
    					Distributed_Janssen: 24600,
    					Distributed_Moderna: 498200,
    					Distributed_Per_100k_18Plus: 65582,
    					Distributed_Per_100k_65Plus: 255991,
    					Distributed_Pfizer: 416715,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 764903,
    					Doses_Distributed: 939515,
    					LongName: "West Virginia",
    					Series_Complete_18Plus: 286238,
    					Series_Complete_18PlusPop_Pct: 20,
    					Series_Complete_65Plus: 159187,
    					Series_Complete_65PlusPop_Pct: 43.4,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 4108,
    					Series_Complete_Janssen_18Plus: 4104,
    					Series_Complete_Janssen_65Plus: 1042,
    					Series_Complete_Moderna: 137602,
    					Series_Complete_Moderna_18Plus: 137548,
    					Series_Complete_Moderna_65Plus: 77454,
    					Series_Complete_Pfizer: 144791,
    					Series_Complete_Pfizer_18Plus: 144570,
    					Series_Complete_Pfizer_65Plus: 80681,
    					Series_Complete_Pop_Pct: 16,
    					Series_Complete_Unk_Manuf: 16,
    					Series_Complete_Unk_Manuf_18Plus: 16,
    					Series_Complete_Unk_Manuf_65Plus: 10,
    					Series_Complete_Yes: 286517,
    					ShortName: "WVA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						[
    							32
    						]
    					],
    					[
    						[
    							33
    						]
    					],
    					[
    						[
    							34,
    							-5,
    							35,
    							36
    						]
    					]
    				],
    				type: "MultiPolygon",
    				properties: {
    					STATEFP: "22",
    					STATENS: "01629543",
    					AFFGEOID: "0400000US22",
    					GEOID: "22",
    					STUSPS: "LA",
    					NAME: "Louisiana",
    					LSAD: "00",
    					ALAND: 111897594374,
    					AWATER: 23753621895,
    					Admin_Per_100K: 36324,
    					Admin_Per_100k_18Plus: 47364,
    					Admin_Per_100k_65Plus: 119195,
    					Administered_18Plus: 1686727,
    					Administered_65Plus: 883262,
    					Administered_Dose1_Pop_Pct: 23.1,
    					Administered_Dose1_Recip: 1072631,
    					Administered_Dose1_Recip_18Plus: 1070897,
    					Administered_Dose1_Recip_18PlusPop_Pct: 30.1,
    					Administered_Dose1_Recip_65Plus: 497534,
    					Administered_Dose1_Recip_65PlusPop_Pct: 67.1,
    					Administered_Dose2_Pop_Pct: 12.6,
    					Administered_Dose2_Recip: 585146,
    					Administered_Dose2_Recip_18Plus: 585003,
    					Administered_Dose2_Recip_18PlusPop_Pct: 16.4,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 44695,
    					Administered_Moderna: 742955,
    					Administered_Pfizer: 900182,
    					Administered_Unk_Manuf: 801,
    					Census2019: 4648794,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 46560,
    					Distributed_Janssen: 58000,
    					Distributed_Moderna: 1067900,
    					Distributed_Per_100k_18Plus: 60780,
    					Distributed_Per_100k_65Plus: 292093,
    					Distributed_Pfizer: 1038570,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 1688633,
    					Doses_Distributed: 2164470,
    					LongName: "Louisiana",
    					Series_Complete_18Plus: 628417,
    					Series_Complete_18PlusPop_Pct: 17.6,
    					Series_Complete_65Plus: 377953,
    					Series_Complete_65PlusPop_Pct: 51,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 43437,
    					Series_Complete_Janssen_18Plus: 43414,
    					Series_Complete_Janssen_65Plus: 10083,
    					Series_Complete_Moderna: 234524,
    					Series_Complete_Moderna_18Plus: 234507,
    					Series_Complete_Moderna_65Plus: 161034,
    					Series_Complete_Pfizer: 350262,
    					Series_Complete_Pfizer_18Plus: 350137,
    					Series_Complete_Pfizer_65Plus: 206765,
    					Series_Complete_Pop_Pct: 13.5,
    					Series_Complete_Unk_Manuf: 360,
    					Series_Complete_Unk_Manuf_18Plus: 359,
    					Series_Complete_Unk_Manuf_65Plus: 71,
    					Series_Complete_Yes: 628583,
    					ShortName: "LAA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						[
    							37
    						]
    					],
    					[
    						[
    							38
    						]
    					],
    					[
    						[
    							39
    						]
    					],
    					[
    						[
    							40
    						]
    					],
    					[
    						[
    							41
    						]
    					],
    					[
    						[
    							42,
    							43,
    							44
    						]
    					],
    					[
    						[
    							45
    						]
    					],
    					[
    						[
    							46,
    							47
    						]
    					]
    				],
    				type: "MultiPolygon",
    				properties: {
    					STATEFP: "26",
    					STATENS: "01779789",
    					AFFGEOID: "0400000US26",
    					GEOID: "26",
    					STUSPS: "MI",
    					NAME: "Michigan",
    					LSAD: "00",
    					ALAND: 146600952990,
    					AWATER: 103885855702,
    					Admin_Per_100K: 37527,
    					Admin_Per_100k_18Plus: 47746,
    					Admin_Per_100k_65Plus: 107771,
    					Administered_18Plus: 3744712,
    					Administered_65Plus: 1902599,
    					Administered_Dose1_Pop_Pct: 24.5,
    					Administered_Dose1_Recip: 2442742,
    					Administered_Dose1_Recip_18Plus: 2440355,
    					Administered_Dose1_Recip_18PlusPop_Pct: 31.1,
    					Administered_Dose1_Recip_65Plus: 1197300,
    					Administered_Dose1_Recip_65PlusPop_Pct: 67.8,
    					Administered_Dose2_Pop_Pct: 13.4,
    					Administered_Dose2_Recip: 1340891,
    					Administered_Dose2_Recip_18Plus: 1340187,
    					Administered_Dose2_Recip_18PlusPop_Pct: 17.1,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 51089,
    					Administered_Moderna: 1780865,
    					Administered_Pfizer: 1915834,
    					Administered_Unk_Manuf: 0,
    					Census2019: 9986857,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 45490,
    					Distributed_Janssen: 125400,
    					Distributed_Moderna: 2210600,
    					Distributed_Per_100k_18Plus: 57925,
    					Distributed_Per_100k_65Plus: 257336,
    					Distributed_Pfizer: 2207010,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 3747788,
    					Doses_Distributed: 4543010,
    					LongName: "Michigan",
    					Series_Complete_18Plus: 1392097,
    					Series_Complete_18PlusPop_Pct: 17.7,
    					Series_Complete_65Plus: 747084,
    					Series_Complete_65PlusPop_Pct: 42.3,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 51937,
    					Series_Complete_Janssen_18Plus: 51910,
    					Series_Complete_Janssen_65Plus: 17088,
    					Series_Complete_Moderna: 594573,
    					Series_Complete_Moderna_18Plus: 594512,
    					Series_Complete_Moderna_65Plus: 342282,
    					Series_Complete_Pfizer: 746266,
    					Series_Complete_Pfizer_18Plus: 745623,
    					Series_Complete_Pfizer_65Plus: 387673,
    					Series_Complete_Pop_Pct: 13.9,
    					Series_Complete_Unk_Manuf: 52,
    					Series_Complete_Unk_Manuf_18Plus: 52,
    					Series_Complete_Unk_Manuf_65Plus: 41,
    					Series_Complete_Yes: 1392828,
    					ShortName: "MIA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						[
    							48
    						]
    					],
    					[
    						[
    							49
    						]
    					],
    					[
    						[
    							50,
    							51,
    							52,
    							53,
    							54,
    							55,
    							56,
    							57
    						]
    					]
    				],
    				type: "MultiPolygon",
    				properties: {
    					STATEFP: "25",
    					STATENS: "00606926",
    					AFFGEOID: "0400000US25",
    					GEOID: "25",
    					STUSPS: "MA",
    					NAME: "Massachusetts",
    					LSAD: "00",
    					ALAND: 20205125364,
    					AWATER: 7129925486,
    					Admin_Per_100K: 44004,
    					Admin_Per_100k_18Plus: 54631,
    					Admin_Per_100k_65Plus: 116426,
    					Administered_18Plus: 3026389,
    					Administered_65Plus: 1361402,
    					Administered_Dose1_Pop_Pct: 29.1,
    					Administered_Dose1_Recip: 2008501,
    					Administered_Dose1_Recip_18Plus: 2003850,
    					Administered_Dose1_Recip_18PlusPop_Pct: 36.2,
    					Administered_Dose1_Recip_65Plus: 893816,
    					Administered_Dose1_Recip_65PlusPop_Pct: 76.4,
    					Administered_Dose2_Pop_Pct: 14.4,
    					Administered_Dose2_Recip: 995917,
    					Administered_Dose2_Recip_18Plus: 994121,
    					Administered_Dose2_Recip_18PlusPop_Pct: 17.9,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 73183,
    					Administered_Moderna: 1491073,
    					Administered_Pfizer: 1468691,
    					Administered_Unk_Manuf: 49,
    					Census2019: 6892503,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 48196,
    					Distributed_Janssen: 97800,
    					Distributed_Moderna: 1637200,
    					Distributed_Per_100k_18Plus: 59965,
    					Distributed_Per_100k_65Plus: 284086,
    					Distributed_Pfizer: 1586910,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 3032996,
    					Doses_Distributed: 3321910,
    					LongName: "Massachusetts",
    					Series_Complete_18Plus: 1067236,
    					Series_Complete_18PlusPop_Pct: 19.3,
    					Series_Complete_65Plus: 503247,
    					Series_Complete_65PlusPop_Pct: 43,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 73149,
    					Series_Complete_Janssen_18Plus: 73115,
    					Series_Complete_Janssen_65Plus: 36518,
    					Series_Complete_Moderna: 479485,
    					Series_Complete_Moderna_18Plus: 479368,
    					Series_Complete_Moderna_65Plus: 199573,
    					Series_Complete_Pfizer: 516425,
    					Series_Complete_Pfizer_18Plus: 514746,
    					Series_Complete_Pfizer_65Plus: 267153,
    					Series_Complete_Pop_Pct: 15.5,
    					Series_Complete_Unk_Manuf: 7,
    					Series_Complete_Unk_Manuf_18Plus: 7,
    					Series_Complete_Unk_Manuf_65Plus: 3,
    					Series_Complete_Yes: 1069066,
    					ShortName: "MAA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						58,
    						59,
    						60,
    						61,
    						62,
    						63,
    						64
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "16",
    					STATENS: "01779783",
    					AFFGEOID: "0400000US16",
    					GEOID: "16",
    					STUSPS: "ID",
    					NAME: "Idaho",
    					LSAD: "00",
    					ALAND: 214049787659,
    					AWATER: 2391722557,
    					Admin_Per_100K: 36397,
    					Admin_Per_100k_18Plus: 48579,
    					Admin_Per_100k_65Plus: 113592,
    					Administered_18Plus: 650409,
    					Administered_65Plus: 330177,
    					Administered_Dose1_Pop_Pct: 22.4,
    					Administered_Dose1_Recip: 400267,
    					Administered_Dose1_Recip_18Plus: 400234,
    					Administered_Dose1_Recip_18PlusPop_Pct: 29.9,
    					Administered_Dose1_Recip_65Plus: 198316,
    					Administered_Dose1_Recip_65PlusPop_Pct: 68.2,
    					Administered_Dose2_Pop_Pct: 13.4,
    					Administered_Dose2_Recip: 240007,
    					Administered_Dose2_Recip_18Plus: 239997,
    					Administered_Dose2_Recip_18PlusPop_Pct: 17.9,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 10492,
    					Administered_Moderna: 325290,
    					Administered_Pfizer: 314440,
    					Administered_Unk_Manuf: 215,
    					Census2019: 1787065,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 43948,
    					Distributed_Janssen: 21300,
    					Distributed_Moderna: 384800,
    					Distributed_Per_100k_18Plus: 58660,
    					Distributed_Per_100k_65Plus: 270195,
    					Distributed_Pfizer: 379275,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 650437,
    					Doses_Distributed: 785375,
    					LongName: "Idaho",
    					Series_Complete_18Plus: 250258,
    					Series_Complete_18PlusPop_Pct: 18.7,
    					Series_Complete_65Plus: 134072,
    					Series_Complete_65PlusPop_Pct: 46.1,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 10267,
    					Series_Complete_Janssen_18Plus: 10261,
    					Series_Complete_Janssen_65Plus: 3349,
    					Series_Complete_Moderna: 123998,
    					Series_Complete_Moderna_18Plus: 123996,
    					Series_Complete_Moderna_65Plus: 62020,
    					Series_Complete_Pfizer: 115967,
    					Series_Complete_Pfizer_18Plus: 115959,
    					Series_Complete_Pfizer_65Plus: 68680,
    					Series_Complete_Pop_Pct: 14,
    					Series_Complete_Unk_Manuf: 42,
    					Series_Complete_Unk_Manuf_18Plus: 42,
    					Series_Complete_Unk_Manuf_65Plus: 23,
    					Series_Complete_Yes: 250274,
    					ShortName: "IDA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						[
    							65
    						]
    					],
    					[
    						[
    							66
    						]
    					],
    					[
    						[
    							67
    						]
    					],
    					[
    						[
    							68,
    							69,
    							70
    						]
    					]
    				],
    				type: "MultiPolygon",
    				properties: {
    					STATEFP: "12",
    					STATENS: "00294478",
    					AFFGEOID: "0400000US12",
    					GEOID: "12",
    					STUSPS: "FL",
    					NAME: "Florida",
    					LSAD: "00",
    					ALAND: 138949136250,
    					AWATER: 31361101223,
    					Admin_Per_100K: 38139,
    					Admin_Per_100k_18Plus: 47432,
    					Admin_Per_100k_65Plus: 124325,
    					Administered_18Plus: 8180934,
    					Administered_65Plus: 5591318,
    					Administered_Dose1_Pop_Pct: 23.8,
    					Administered_Dose1_Recip: 5109346,
    					Administered_Dose1_Recip_18Plus: 5100281,
    					Administered_Dose1_Recip_18PlusPop_Pct: 29.6,
    					Administered_Dose1_Recip_65Plus: 3214318,
    					Administered_Dose1_Recip_65PlusPop_Pct: 71.5,
    					Administered_Dose2_Pop_Pct: 12.6,
    					Administered_Dose2_Recip: 2704717,
    					Administered_Dose2_Recip_18Plus: 2703555,
    					Administered_Dose2_Recip_18PlusPop_Pct: 15.7,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 155166,
    					Administered_Moderna: 4015761,
    					Administered_Pfizer: 4009497,
    					Administered_Unk_Manuf: 10870,
    					Census2019: 21477737,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 49779,
    					Distributed_Janssen: 322000,
    					Distributed_Moderna: 5024200,
    					Distributed_Per_100k_18Plus: 61987,
    					Distributed_Per_100k_65Plus: 237726,
    					Distributed_Pfizer: 5345145,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 8191294,
    					Doses_Distributed: 10691345,
    					LongName: "Florida",
    					Series_Complete_18Plus: 2857907,
    					Series_Complete_18PlusPop_Pct: 16.6,
    					Series_Complete_65Plus: 2088582,
    					Series_Complete_65PlusPop_Pct: 46.4,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 154405,
    					Series_Complete_Janssen_18Plus: 154352,
    					Series_Complete_Janssen_65Plus: 55318,
    					Series_Complete_Moderna: 1347505,
    					Series_Complete_Moderna_18Plus: 1346926,
    					Series_Complete_Moderna_65Plus: 1020625,
    					Series_Complete_Pfizer: 1353614,
    					Series_Complete_Pfizer_18Plus: 1353031,
    					Series_Complete_Pfizer_65Plus: 1009549,
    					Series_Complete_Pop_Pct: 13.3,
    					Series_Complete_Unk_Manuf: 3598,
    					Series_Complete_Unk_Manuf_18Plus: 3598,
    					Series_Complete_Unk_Manuf_65Plus: 3090,
    					Series_Complete_Yes: 2859122,
    					ShortName: "FLA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						71,
    						72,
    						73,
    						74,
    						75,
    						76
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "31",
    					STATENS: "01779792",
    					AFFGEOID: "0400000US31",
    					GEOID: "31",
    					STUSPS: "NE",
    					NAME: "Nebraska",
    					LSAD: "00",
    					ALAND: 198956658395,
    					AWATER: 1371829134,
    					Admin_Per_100K: 41222,
    					Admin_Per_100k_18Plus: 54567,
    					Admin_Per_100k_65Plus: 123908,
    					Administered_18Plus: 795764,
    					Administered_65Plus: 387162,
    					Administered_Dose1_Pop_Pct: 26.6,
    					Administered_Dose1_Recip: 515361,
    					Administered_Dose1_Recip_18Plus: 514149,
    					Administered_Dose1_Recip_18PlusPop_Pct: 35.3,
    					Administered_Dose1_Recip_65Plus: 236600,
    					Administered_Dose1_Recip_65PlusPop_Pct: 75.7,
    					Administered_Dose2_Pop_Pct: 14.2,
    					Administered_Dose2_Recip: 275099,
    					Administered_Dose2_Recip_18Plus: 274659,
    					Administered_Dose2_Recip_18PlusPop_Pct: 18.8,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 19370,
    					Administered_Moderna: 372682,
    					Administered_Pfizer: 403818,
    					Administered_Unk_Manuf: 1539,
    					Census2019: 1934408,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 48667,
    					Distributed_Janssen: 28900,
    					Distributed_Moderna: 453100,
    					Distributed_Per_100k_18Plus: 64554,
    					Distributed_Per_100k_65Plus: 301295,
    					Distributed_Pfizer: 459420,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 797409,
    					Doses_Distributed: 941420,
    					LongName: "Nebraska",
    					Series_Complete_18Plus: 294560,
    					Series_Complete_18PlusPop_Pct: 20.2,
    					Series_Complete_65Plus: 148102,
    					Series_Complete_65PlusPop_Pct: 47.4,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 19907,
    					Series_Complete_Janssen_18Plus: 19901,
    					Series_Complete_Janssen_65Plus: 1484,
    					Series_Complete_Moderna: 130789,
    					Series_Complete_Moderna_18Plus: 130761,
    					Series_Complete_Moderna_65Plus: 65064,
    					Series_Complete_Pfizer: 143911,
    					Series_Complete_Pfizer_18Plus: 143499,
    					Series_Complete_Pfizer_65Plus: 81245,
    					Series_Complete_Pop_Pct: 15.3,
    					Series_Complete_Unk_Manuf: 399,
    					Series_Complete_Unk_Manuf_18Plus: 399,
    					Series_Complete_Unk_Manuf_65Plus: 309,
    					Series_Complete_Yes: 295006,
    					ShortName: "NEA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						[
    							77
    						]
    					],
    					[
    						[
    							78
    						]
    					],
    					[
    						[
    							79
    						]
    					],
    					[
    						[
    							80
    						]
    					],
    					[
    						[
    							81
    						]
    					],
    					[
    						[
    							82
    						]
    					],
    					[
    						[
    							-59,
    							83,
    							84
    						]
    					],
    					[
    						[
    							85
    						]
    					]
    				],
    				type: "MultiPolygon",
    				properties: {
    					STATEFP: "53",
    					STATENS: "01779804",
    					AFFGEOID: "0400000US53",
    					GEOID: "53",
    					STUSPS: "WA",
    					NAME: "Washington",
    					LSAD: "00",
    					ALAND: 172112588220,
    					AWATER: 12559278850,
    					Admin_Per_100K: 39995,
    					Admin_Per_100k_18Plus: 51072,
    					Admin_Per_100k_65Plus: 123603,
    					Administered_18Plus: 3039691,
    					Administered_65Plus: 1495255,
    					Administered_Dose1_Pop_Pct: 25.8,
    					Administered_Dose1_Recip: 1968308,
    					Administered_Dose1_Recip_18Plus: 1963572,
    					Administered_Dose1_Recip_18PlusPop_Pct: 33,
    					Administered_Dose1_Recip_65Plus: 908576,
    					Administered_Dose1_Recip_65PlusPop_Pct: 75.1,
    					Administered_Dose2_Pop_Pct: 13.9,
    					Administered_Dose2_Recip: 1057003,
    					Administered_Dose2_Recip_18Plus: 1055841,
    					Administered_Dose2_Recip_18PlusPop_Pct: 17.7,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 56801,
    					Administered_Moderna: 1452036,
    					Administered_Pfizer: 1534359,
    					Administered_Unk_Manuf: 2401,
    					Census2019: 7614893,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 47103,
    					Distributed_Janssen: 90300,
    					Distributed_Moderna: 1760300,
    					Distributed_Per_100k_18Plus: 60265,
    					Distributed_Per_100k_65Plus: 296504,
    					Distributed_Pfizer: 1736280,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 3045597,
    					Doses_Distributed: 3586880,
    					LongName: "Washington",
    					Series_Complete_18Plus: 1113017,
    					Series_Complete_18PlusPop_Pct: 18.7,
    					Series_Complete_65Plus: 596157,
    					Series_Complete_65PlusPop_Pct: 49.3,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 57181,
    					Series_Complete_Janssen_18Plus: 57176,
    					Series_Complete_Janssen_65Plus: 22169,
    					Series_Complete_Moderna: 546518,
    					Series_Complete_Moderna_18Plus: 546455,
    					Series_Complete_Moderna_65Plus: 298346,
    					Series_Complete_Pfizer: 510059,
    					Series_Complete_Pfizer_18Plus: 508960,
    					Series_Complete_Pfizer_65Plus: 275322,
    					Series_Complete_Pop_Pct: 14.6,
    					Series_Complete_Unk_Manuf: 426,
    					Series_Complete_Unk_Manuf_18Plus: 426,
    					Series_Complete_Unk_Manuf_65Plus: 320,
    					Series_Complete_Yes: 1114184,
    					ShortName: "WAA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						86,
    						-19,
    						87,
    						88,
    						89
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "35",
    					STATENS: "00897535",
    					AFFGEOID: "0400000US35",
    					GEOID: "35",
    					STUSPS: "NM",
    					NAME: "New Mexico",
    					LSAD: "00",
    					ALAND: 314196306401,
    					AWATER: 728776523,
    					Admin_Per_100K: 52374,
    					Admin_Per_100k_18Plus: 67255,
    					Admin_Per_100k_65Plus: 109691,
    					Administered_18Plus: 1090194,
    					Administered_65Plus: 414201,
    					Administered_Dose1_Pop_Pct: 33.3,
    					Administered_Dose1_Recip: 699102,
    					Administered_Dose1_Recip_18Plus: 692698,
    					Administered_Dose1_Recip_18PlusPop_Pct: 42.7,
    					Administered_Dose1_Recip_65Plus: 256207,
    					Administered_Dose1_Recip_65PlusPop_Pct: 67.9,
    					Administered_Dose2_Pop_Pct: 19.6,
    					Administered_Dose2_Recip: 409944,
    					Administered_Dose2_Recip_18Plus: 406950,
    					Administered_Dose2_Recip_18PlusPop_Pct: 25.1,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 15459,
    					Administered_Moderna: 496796,
    					Administered_Pfizer: 584600,
    					Administered_Unk_Manuf: 1342,
    					Census2019: 2096829,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 56458,
    					Distributed_Janssen: 29800,
    					Distributed_Moderna: 550500,
    					Distributed_Per_100k_18Plus: 73031,
    					Distributed_Per_100k_65Plus: 313508,
    					Distributed_Pfizer: 603525,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 1098197,
    					Doses_Distributed: 1183825,
    					LongName: "New Mexico",
    					Series_Complete_18Plus: 422090,
    					Series_Complete_18PlusPop_Pct: 26,
    					Series_Complete_65Plus: 168758,
    					Series_Complete_65PlusPop_Pct: 44.7,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 15165,
    					Series_Complete_Janssen_18Plus: 15140,
    					Series_Complete_Janssen_65Plus: 5681,
    					Series_Complete_Moderna: 174634,
    					Series_Complete_Moderna_18Plus: 174552,
    					Series_Complete_Moderna_65Plus: 75699,
    					Series_Complete_Pfizer: 234972,
    					Series_Complete_Pfizer_18Plus: 232060,
    					Series_Complete_Pfizer_65Plus: 87172,
    					Series_Complete_Pop_Pct: 20.3,
    					Series_Complete_Unk_Manuf: 338,
    					Series_Complete_Unk_Manuf_18Plus: 338,
    					Series_Complete_Unk_Manuf_65Plus: 206,
    					Series_Complete_Yes: 425109,
    					ShortName: "NMA",
    					date_type: "Report",
    					fill: "rgb(213, 213, 232)"
    				}
    			},
    			{
    				type: null,
    				properties: {
    					STATEFP: "72",
    					STATENS: "01779808",
    					AFFGEOID: "0400000US72",
    					GEOID: "72",
    					STUSPS: "PR",
    					NAME: "Puerto Rico",
    					LSAD: "00",
    					ALAND: 8868896030,
    					AWATER: 4922382562,
    					Admin_Per_100K: 28060,
    					Admin_Per_100k_18Plus: 34171,
    					Admin_Per_100k_65Plus: 74876,
    					Administered_18Plus: 895611,
    					Administered_65Plus: 406524,
    					Administered_Dose1_Pop_Pct: 18,
    					Administered_Dose1_Recip: 576006,
    					Administered_Dose1_Recip_18Plus: 575561,
    					Administered_Dose1_Recip_18PlusPop_Pct: 22,
    					Administered_Dose1_Recip_65Plus: 273962,
    					Administered_Dose1_Recip_65PlusPop_Pct: 50.5,
    					Administered_Dose2_Pop_Pct: 10.1,
    					Administered_Dose2_Recip: 323203,
    					Administered_Dose2_Recip_18Plus: 323084,
    					Administered_Dose2_Recip_18PlusPop_Pct: 12.3,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 8564,
    					Administered_Moderna: 372211,
    					Administered_Pfizer: 515129,
    					Administered_Unk_Manuf: 249,
    					Census2019: 3193694,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 51668,
    					Distributed_Janssen: 43900,
    					Distributed_Moderna: 804000,
    					Distributed_Per_100k_18Plus: 62959,
    					Distributed_Per_100k_65Plus: 303932,
    					Distributed_Pfizer: 802230,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 896153,
    					Doses_Distributed: 1650130,
    					LongName: "Puerto Rico",
    					Series_Complete_18Plus: 331747,
    					Series_Complete_18PlusPop_Pct: 12.7,
    					Series_Complete_65Plus: 137900,
    					Series_Complete_65PlusPop_Pct: 25.4,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 8671,
    					Series_Complete_Janssen_18Plus: 8663,
    					Series_Complete_Janssen_65Plus: 2065,
    					Series_Complete_Moderna: 133429,
    					Series_Complete_Moderna_18Plus: 133409,
    					Series_Complete_Moderna_65Plus: 63072,
    					Series_Complete_Pfizer: 189767,
    					Series_Complete_Pfizer_18Plus: 189668,
    					Series_Complete_Pfizer_65Plus: 72763,
    					Series_Complete_Pop_Pct: 10.4,
    					Series_Complete_Unk_Manuf: 7,
    					Series_Complete_Unk_Manuf_18Plus: 7,
    					Series_Complete_Unk_Manuf_65Plus: 0,
    					Series_Complete_Yes: 331874,
    					ShortName: "PRA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						90,
    						91,
    						92,
    						93,
    						-72,
    						94
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "46",
    					STATENS: "01785534",
    					AFFGEOID: "0400000US46",
    					GEOID: "46",
    					STUSPS: "SD",
    					NAME: "South Dakota",
    					LSAD: "00",
    					ALAND: 196346981786,
    					AWATER: 3382720225,
    					Admin_Per_100K: 48389,
    					Admin_Per_100k_18Plus: 63934,
    					Admin_Per_100k_65Plus: 139618,
    					Administered_18Plus: 426799,
    					Administered_65Plus: 212039,
    					Administered_Dose1_Pop_Pct: 30.4,
    					Administered_Dose1_Recip: 268972,
    					Administered_Dose1_Recip_18Plus: 268055,
    					Administered_Dose1_Recip_18PlusPop_Pct: 40.2,
    					Administered_Dose1_Recip_65Plus: 124372,
    					Administered_Dose1_Recip_65PlusPop_Pct: 81.9,
    					Administered_Dose2_Pop_Pct: 18.1,
    					Administered_Dose2_Recip: 159898,
    					Administered_Dose2_Recip_18Plus: 159547,
    					Administered_Dose2_Recip_18PlusPop_Pct: 23.9,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 5265,
    					Administered_Moderna: 213230,
    					Administered_Pfizer: 209568,
    					Administered_Unk_Manuf: 13,
    					Census2019: 884659,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 58851,
    					Distributed_Janssen: 12400,
    					Distributed_Moderna: 267800,
    					Distributed_Per_100k_18Plus: 77991,
    					Distributed_Per_100k_65Plus: 342814,
    					Distributed_Pfizer: 240435,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 428076,
    					Doses_Distributed: 520635,
    					LongName: "South Dakota",
    					Series_Complete_18Plus: 164872,
    					Series_Complete_18PlusPop_Pct: 24.7,
    					Series_Complete_65Plus: 89824,
    					Series_Complete_65PlusPop_Pct: 59.1,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 5326,
    					Series_Complete_Janssen_18Plus: 5325,
    					Series_Complete_Janssen_65Plus: 917,
    					Series_Complete_Moderna: 79538,
    					Series_Complete_Moderna_18Plus: 79525,
    					Series_Complete_Moderna_65Plus: 42445,
    					Series_Complete_Pfizer: 80356,
    					Series_Complete_Pfizer_18Plus: 80018,
    					Series_Complete_Pfizer_65Plus: 46461,
    					Series_Complete_Pop_Pct: 18.7,
    					Series_Complete_Unk_Manuf: 4,
    					Series_Complete_Unk_Manuf_18Plus: 4,
    					Series_Complete_Unk_Manuf_65Plus: 1,
    					Series_Complete_Yes: 165224,
    					ShortName: "SDA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						[
    							95
    						]
    					],
    					[
    						[
    							96
    						]
    					],
    					[
    						[
    							-18,
    							97,
    							-37,
    							98,
    							-88
    						]
    					]
    				],
    				type: "MultiPolygon",
    				properties: {
    					STATEFP: "48",
    					STATENS: "01779801",
    					AFFGEOID: "0400000US48",
    					GEOID: "48",
    					STUSPS: "TX",
    					NAME: "Texas",
    					LSAD: "00",
    					ALAND: 676653171537,
    					AWATER: 19006305260,
    					Admin_Per_100K: 33572,
    					Admin_Per_100k_18Plus: 44877,
    					Admin_Per_100k_65Plus: 102259,
    					Administered_18Plus: 9691733,
    					Administered_65Plus: 3818569,
    					Administered_Dose1_Pop_Pct: 22,
    					Administered_Dose1_Recip: 6390503,
    					Administered_Dose1_Recip_18Plus: 6361726,
    					Administered_Dose1_Recip_18PlusPop_Pct: 29.5,
    					Administered_Dose1_Recip_65Plus: 2631610,
    					Administered_Dose1_Recip_65PlusPop_Pct: 70.5,
    					Administered_Dose2_Pop_Pct: 10.2,
    					Administered_Dose2_Recip: 2970050,
    					Administered_Dose2_Recip_18Plus: 2956676,
    					Administered_Dose2_Recip_18PlusPop_Pct: 13.7,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 225713,
    					Administered_Moderna: 4550899,
    					Administered_Pfizer: 4957509,
    					Administered_Unk_Manuf: 344,
    					Census2019: 28995881,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 43501,
    					Distributed_Janssen: 394300,
    					Distributed_Moderna: 5969000,
    					Distributed_Per_100k_18Plus: 58407,
    					Distributed_Per_100k_65Plus: 337784,
    					Distributed_Pfizer: 6250335,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 9734465,
    					Doses_Distributed: 12613635,
    					LongName: "Texas",
    					Series_Complete_18Plus: 3177152,
    					Series_Complete_18PlusPop_Pct: 14.7,
    					Series_Complete_65Plus: 1434909,
    					Series_Complete_65PlusPop_Pct: 38.4,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 221800,
    					Series_Complete_Janssen_18Plus: 220801,
    					Series_Complete_Janssen_65Plus: 99721,
    					Series_Complete_Moderna: 1454442,
    					Series_Complete_Moderna_18Plus: 1447892,
    					Series_Complete_Moderna_65Plus: 653917,
    					Series_Complete_Pfizer: 1515081,
    					Series_Complete_Pfizer_18Plus: 1508258,
    					Series_Complete_Pfizer_65Plus: 681180,
    					Series_Complete_Pop_Pct: 11,
    					Series_Complete_Unk_Manuf: 200,
    					Series_Complete_Unk_Manuf_18Plus: 199,
    					Series_Complete_Unk_Manuf_65Plus: 90,
    					Series_Complete_Yes: 3191523,
    					ShortName: "TXA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						[
    							99
    						]
    					],
    					[
    						[
    							100
    						]
    					],
    					[
    						[
    							101
    						]
    					],
    					[
    						[
    							102
    						]
    					],
    					[
    						[
    							103
    						]
    					],
    					[
    						[
    							104
    						]
    					],
    					[
    						[
    							105,
    							106,
    							107,
    							108
    						]
    					]
    				],
    				type: "MultiPolygon",
    				properties: {
    					STATEFP: "06",
    					STATENS: "01779778",
    					AFFGEOID: "0400000US06",
    					GEOID: "06",
    					STUSPS: "CA",
    					NAME: "California",
    					LSAD: "00",
    					ALAND: 403503931312,
    					AWATER: 20463871877,
    					Admin_Per_100K: 38091,
    					Admin_Per_100k_18Plus: 49034,
    					Admin_Per_100k_65Plus: 119071,
    					Administered_18Plus: 15013151,
    					Administered_65Plus: 6951476,
    					Administered_Dose1_Pop_Pct: 25.5,
    					Administered_Dose1_Recip: 10070870,
    					Administered_Dose1_Recip_18Plus: 10038786,
    					Administered_Dose1_Recip_18PlusPop_Pct: 32.8,
    					Administered_Dose1_Recip_65Plus: 4301066,
    					Administered_Dose1_Recip_65PlusPop_Pct: 73.7,
    					Administered_Dose2_Pop_Pct: 12.4,
    					Administered_Dose2_Recip: 4882772,
    					Administered_Dose2_Recip_18Plus: 4877483,
    					Administered_Dose2_Recip_18PlusPop_Pct: 15.9,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 221520,
    					Administered_Moderna: 7237957,
    					Administered_Pfizer: 7590393,
    					Administered_Unk_Manuf: 803,
    					Census2019: 39512223,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 47773,
    					Distributed_Janssen: 511800,
    					Distributed_Moderna: 8991700,
    					Distributed_Per_100k_18Plus: 61651,
    					Distributed_Per_100k_65Plus: 323323,
    					Distributed_Pfizer: 9372480,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 15050673,
    					Doses_Distributed: 18875980,
    					LongName: "California",
    					Series_Complete_18Plus: 5096771,
    					Series_Complete_18PlusPop_Pct: 16.6,
    					Series_Complete_65Plus: 2633312,
    					Series_Complete_65PlusPop_Pct: 45.1,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 219708,
    					Series_Complete_Janssen_18Plus: 219288,
    					Series_Complete_Janssen_65Plus: 33440,
    					Series_Complete_Moderna: 2349800,
    					Series_Complete_Moderna_18Plus: 2349033,
    					Series_Complete_Moderna_65Plus: 1334653,
    					Series_Complete_Pfizer: 2532857,
    					Series_Complete_Pfizer_18Plus: 2528335,
    					Series_Complete_Pfizer_65Plus: 1265141,
    					Series_Complete_Pop_Pct: 12.9,
    					Series_Complete_Unk_Manuf: 115,
    					Series_Complete_Unk_Manuf_18Plus: 115,
    					Series_Complete_Unk_Manuf_65Plus: 78,
    					Series_Complete_Yes: 5102480,
    					ShortName: "CAA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						[
    							109
    						]
    					],
    					[
    						[
    							110,
    							111,
    							-71,
    							112,
    							-3
    						]
    					]
    				],
    				type: "MultiPolygon",
    				properties: {
    					STATEFP: "01",
    					STATENS: "01779775",
    					AFFGEOID: "0400000US01",
    					GEOID: "01",
    					STUSPS: "AL",
    					NAME: "Alabama",
    					LSAD: "00",
    					ALAND: 131174048583,
    					AWATER: 4593327154,
    					Admin_Per_100K: 30170,
    					Admin_Per_100k_18Plus: 38750,
    					Admin_Per_100k_65Plus: 92130,
    					Administered_18Plus: 1478282,
    					Administered_65Plus: 782954,
    					Administered_Dose1_Pop_Pct: 19.8,
    					Administered_Dose1_Recip: 972986,
    					Administered_Dose1_Recip_18Plus: 972149,
    					Administered_Dose1_Recip_18PlusPop_Pct: 25.5,
    					Administered_Dose1_Recip_65Plus: 495715,
    					Administered_Dose1_Recip_65PlusPop_Pct: 58.3,
    					Administered_Dose2_Pop_Pct: 11,
    					Administered_Dose2_Recip: 541405,
    					Administered_Dose2_Recip_18Plus: 541230,
    					Administered_Dose2_Recip_18PlusPop_Pct: 14.2,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 26918,
    					Administered_Moderna: 759251,
    					Administered_Pfizer: 693102,
    					Administered_Unk_Manuf: 0,
    					Census2019: 4903185,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 44418,
    					Distributed_Janssen: 62000,
    					Distributed_Moderna: 1093300,
    					Distributed_Per_100k_18Plus: 57089,
    					Distributed_Per_100k_65Plus: 256270,
    					Distributed_Pfizer: 1022580,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 1479271,
    					Doses_Distributed: 2177880,
    					LongName: "Alabama",
    					Series_Complete_18Plus: 568950,
    					Series_Complete_18PlusPop_Pct: 14.9,
    					Series_Complete_65Plus: 314224,
    					Series_Complete_65PlusPop_Pct: 37,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 27722,
    					Series_Complete_Janssen_18Plus: 27720,
    					Series_Complete_Janssen_65Plus: 11240,
    					Series_Complete_Moderna: 276383,
    					Series_Complete_Moderna_18Plus: 276361,
    					Series_Complete_Moderna_65Plus: 167118,
    					Series_Complete_Pfizer: 264998,
    					Series_Complete_Pfizer_18Plus: 264845,
    					Series_Complete_Pfizer_65Plus: 135852,
    					Series_Complete_Pop_Pct: 11.6,
    					Series_Complete_Unk_Manuf: 24,
    					Series_Complete_Unk_Manuf_18Plus: 24,
    					Series_Complete_Unk_Manuf_65Plus: 14,
    					Series_Complete_Yes: 569127,
    					ShortName: "ALA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						113,
    						-12,
    						114,
    						115,
    						-69,
    						-112
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "13",
    					STATENS: "01705317",
    					AFFGEOID: "0400000US13",
    					GEOID: "13",
    					STUSPS: "GA",
    					NAME: "Georgia",
    					LSAD: "00",
    					ALAND: 149482048342,
    					AWATER: 4422936154,
    					Admin_Per_100K: 30902,
    					Admin_Per_100k_18Plus: 40380,
    					Admin_Per_100k_65Plus: 114398,
    					Administered_18Plus: 3276261,
    					Administered_65Plus: 1735363,
    					Administered_Dose1_Pop_Pct: 19.4,
    					Administered_Dose1_Recip: 2058969,
    					Administered_Dose1_Recip_18Plus: 2054791,
    					Administered_Dose1_Recip_18PlusPop_Pct: 25.3,
    					Administered_Dose1_Recip_65Plus: 985925,
    					Administered_Dose1_Recip_65PlusPop_Pct: 65,
    					Administered_Dose2_Pop_Pct: 10.6,
    					Administered_Dose2_Recip: 1122947,
    					Administered_Dose2_Recip_18Plus: 1122469,
    					Administered_Dose2_Recip_18PlusPop_Pct: 13.8,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 51096,
    					Administered_Moderna: 1733352,
    					Administered_Pfizer: 1496260,
    					Administered_Unk_Manuf: 244,
    					Census2019: 10617423,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 42884,
    					Distributed_Janssen: 116200,
    					Distributed_Moderna: 2301900,
    					Distributed_Per_100k_18Plus: 56118,
    					Distributed_Per_100k_65Plus: 300151,
    					Distributed_Pfizer: 2135055,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 3280952,
    					Doses_Distributed: 4553155,
    					LongName: "Georgia",
    					Series_Complete_18Plus: 1171304,
    					Series_Complete_18PlusPop_Pct: 14.4,
    					Series_Complete_65Plus: 692489,
    					Series_Complete_65PlusPop_Pct: 45.6,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 48939,
    					Series_Complete_Janssen_18Plus: 48835,
    					Series_Complete_Janssen_65Plus: 5989,
    					Series_Complete_Moderna: 621995,
    					Series_Complete_Moderna_18Plus: 621923,
    					Series_Complete_Moderna_65Plus: 409076,
    					Series_Complete_Pfizer: 500801,
    					Series_Complete_Pfizer_18Plus: 500395,
    					Series_Complete_Pfizer_65Plus: 277330,
    					Series_Complete_Pop_Pct: 11,
    					Series_Complete_Unk_Manuf: 151,
    					Series_Complete_Unk_Manuf_18Plus: 151,
    					Series_Complete_Unk_Manuf_65Plus: 94,
    					Series_Complete_Yes: 1171886,
    					ShortName: "GAA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						116,
    						117,
    						118,
    						119,
    						120,
    						121,
    						-30,
    						122
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "42",
    					STATENS: "01779798",
    					AFFGEOID: "0400000US42",
    					GEOID: "42",
    					STUSPS: "PA",
    					NAME: "Pennsylvania",
    					LSAD: "00",
    					ALAND: 115884442321,
    					AWATER: 3394589990,
    					Admin_Per_100K: 37093,
    					Admin_Per_100k_18Plus: 46614,
    					Admin_Per_100k_65Plus: 92972,
    					Administered_18Plus: 4739452,
    					Administered_65Plus: 2225163,
    					Administered_Dose1_Pop_Pct: 25.1,
    					Administered_Dose1_Recip: 3209843,
    					Administered_Dose1_Recip_18Plus: 3202986,
    					Administered_Dose1_Recip_18PlusPop_Pct: 31.5,
    					Administered_Dose1_Recip_65Plus: 1482950,
    					Administered_Dose1_Recip_65PlusPop_Pct: 62,
    					Administered_Dose2_Pop_Pct: 12.1,
    					Administered_Dose2_Recip: 1548354,
    					Administered_Dose2_Recip_18Plus: 1546060,
    					Administered_Dose2_Recip_18PlusPop_Pct: 15.2,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 88506,
    					Administered_Moderna: 2294269,
    					Administered_Pfizer: 2365733,
    					Administered_Unk_Manuf: 105,
    					Census2019: 12801989,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 48879,
    					Distributed_Janssen: 167200,
    					Distributed_Moderna: 3034800,
    					Distributed_Per_100k_18Plus: 61544,
    					Distributed_Per_100k_65Plus: 261450,
    					Distributed_Pfizer: 3055455,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 4748613,
    					Doses_Distributed: 6257455,
    					LongName: "Pennsylvania",
    					Series_Complete_18Plus: 1636730,
    					Series_Complete_18PlusPop_Pct: 16.1,
    					Series_Complete_65Plus: 751165,
    					Series_Complete_65PlusPop_Pct: 31.4,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 90676,
    					Series_Complete_Janssen_18Plus: 90670,
    					Series_Complete_Janssen_65Plus: 12722,
    					Series_Complete_Moderna: 778140,
    					Series_Complete_Moderna_18Plus: 777973,
    					Series_Complete_Moderna_65Plus: 385646,
    					Series_Complete_Pfizer: 770131,
    					Series_Complete_Pfizer_18Plus: 768005,
    					Series_Complete_Pfizer_65Plus: 352748,
    					Series_Complete_Pop_Pct: 12.8,
    					Series_Complete_Unk_Manuf: 83,
    					Series_Complete_Unk_Manuf_18Plus: 82,
    					Series_Complete_Unk_Manuf_65Plus: 49,
    					Series_Complete_Yes: 1639030,
    					ShortName: "PAA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						123,
    						124,
    						125,
    						126,
    						127,
    						128,
    						129,
    						-16,
    						130,
    						-74
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "29",
    					STATENS: "01779791",
    					AFFGEOID: "0400000US29",
    					GEOID: "29",
    					STUSPS: "MO",
    					NAME: "Missouri",
    					LSAD: "00",
    					ALAND: 178050802184,
    					AWATER: 2489425460,
    					Admin_Per_100K: 35431,
    					Admin_Per_100k_18Plus: 45567,
    					Admin_Per_100k_65Plus: 100818,
    					Administered_18Plus: 2172096,
    					Administered_65Plus: 1070721,
    					Administered_Dose1_Pop_Pct: 22.6,
    					Administered_Dose1_Recip: 1387811,
    					Administered_Dose1_Recip_18Plus: 1385956,
    					Administered_Dose1_Recip_18PlusPop_Pct: 29.1,
    					Administered_Dose1_Recip_65Plus: 667967,
    					Administered_Dose1_Recip_65PlusPop_Pct: 62.9,
    					Administered_Dose2_Pop_Pct: 11.7,
    					Administered_Dose2_Recip: 715566,
    					Administered_Dose2_Recip_18Plus: 715082,
    					Administered_Dose2_Recip_18PlusPop_Pct: 15,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 34620,
    					Administered_Moderna: 902880,
    					Administered_Pfizer: 1236760,
    					Administered_Unk_Manuf: 286,
    					Census2019: 6137428,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 46436,
    					Distributed_Janssen: 73200,
    					Distributed_Moderna: 1337100,
    					Distributed_Per_100k_18Plus: 59788,
    					Distributed_Per_100k_65Plus: 268351,
    					Distributed_Pfizer: 1439685,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 2174546,
    					Doses_Distributed: 2849985,
    					LongName: "Missouri",
    					Series_Complete_18Plus: 750825,
    					Series_Complete_18PlusPop_Pct: 15.8,
    					Series_Complete_65Plus: 378733,
    					Series_Complete_65PlusPop_Pct: 35.7,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 35756,
    					Series_Complete_Janssen_18Plus: 35743,
    					Series_Complete_Janssen_65Plus: 11769,
    					Series_Complete_Moderna: 279111,
    					Series_Complete_Moderna_18Plus: 279075,
    					Series_Complete_Moderna_65Plus: 160402,
    					Series_Complete_Pfizer: 436421,
    					Series_Complete_Pfizer_18Plus: 435974,
    					Series_Complete_Pfizer_65Plus: 206548,
    					Series_Complete_Pop_Pct: 12.2,
    					Series_Complete_Unk_Manuf: 34,
    					Series_Complete_Unk_Manuf_18Plus: 33,
    					Series_Complete_Unk_Manuf_65Plus: 14,
    					Series_Complete_Yes: 751322,
    					ShortName: "MOA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						131,
    						-76,
    						132,
    						-14,
    						-87,
    						133
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "08",
    					STATENS: "01779779",
    					AFFGEOID: "0400000US08",
    					GEOID: "08",
    					STUSPS: "CO",
    					NAME: "Colorado",
    					LSAD: "00",
    					ALAND: 268422891711,
    					AWATER: 1181621593,
    					Admin_Per_100K: 39534,
    					Admin_Per_100k_18Plus: 50514,
    					Admin_Per_100k_65Plus: 129665,
    					Administered_18Plus: 2272718,
    					Administered_65Plus: 1092310,
    					Administered_Dose1_Pop_Pct: 24.8,
    					Administered_Dose1_Recip: 1428551,
    					Administered_Dose1_Recip_18Plus: 1425394,
    					Administered_Dose1_Recip_18PlusPop_Pct: 31.7,
    					Administered_Dose1_Recip_65Plus: 631019,
    					Administered_Dose1_Recip_65PlusPop_Pct: 74.9,
    					Administered_Dose2_Pop_Pct: 14.4,
    					Administered_Dose2_Recip: 830558,
    					Administered_Dose2_Recip_18Plus: 829770,
    					Administered_Dose2_Recip_18PlusPop_Pct: 18.4,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 48876,
    					Administered_Moderna: 1100640,
    					Administered_Pfizer: 1126604,
    					Administered_Unk_Manuf: 540,
    					Census2019: 5758736,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 46609,
    					Distributed_Janssen: 66100,
    					Distributed_Moderna: 1319700,
    					Distributed_Per_100k_18Plus: 59657,
    					Distributed_Per_100k_65Plus: 318622,
    					Distributed_Pfizer: 1298310,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 2276660,
    					Doses_Distributed: 2684110,
    					LongName: "Colorado",
    					Series_Complete_18Plus: 877531,
    					Series_Complete_18PlusPop_Pct: 19.5,
    					Series_Complete_65Plus: 460202,
    					Series_Complete_65PlusPop_Pct: 54.6,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 47828,
    					Series_Complete_Janssen_18Plus: 47761,
    					Series_Complete_Janssen_65Plus: 7395,
    					Series_Complete_Moderna: 392818,
    					Series_Complete_Moderna_18Plus: 392746,
    					Series_Complete_Moderna_65Plus: 221187,
    					Series_Complete_Pfizer: 437610,
    					Series_Complete_Pfizer_18Plus: 436894,
    					Series_Complete_Pfizer_65Plus: 231542,
    					Series_Complete_Pop_Pct: 15.3,
    					Series_Complete_Unk_Manuf: 130,
    					Series_Complete_Unk_Manuf_18Plus: 130,
    					Series_Complete_Unk_Manuf_65Plus: 78,
    					Series_Complete_Yes: 878386,
    					ShortName: "COA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						-63,
    						134,
    						-134,
    						135,
    						136
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "49",
    					STATENS: "01455989",
    					AFFGEOID: "0400000US49",
    					GEOID: "49",
    					STUSPS: "UT",
    					NAME: "Utah",
    					LSAD: "00",
    					ALAND: 212886221680,
    					AWATER: 6998824394,
    					Admin_Per_100K: 35481,
    					Admin_Per_100k_18Plus: 49848,
    					Admin_Per_100k_65Plus: 120109,
    					Administered_18Plus: 1133939,
    					Administered_65Plus: 439446,
    					Administered_Dose1_Pop_Pct: 21.7,
    					Administered_Dose1_Recip: 696212,
    					Administered_Dose1_Recip_18Plus: 693506,
    					Administered_Dose1_Recip_18PlusPop_Pct: 30.5,
    					Administered_Dose1_Recip_65Plus: 263662,
    					Administered_Dose1_Recip_65PlusPop_Pct: 72.1,
    					Administered_Dose2_Pop_Pct: 8.7,
    					Administered_Dose2_Recip: 279950,
    					Administered_Dose2_Recip_18Plus: 279393,
    					Administered_Dose2_Recip_18PlusPop_Pct: 12.3,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 27893,
    					Administered_Moderna: 533314,
    					Administered_Pfizer: 576304,
    					Administered_Unk_Manuf: 0,
    					Census2019: 3205958,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 41228,
    					Distributed_Janssen: 35100,
    					Distributed_Moderna: 660700,
    					Distributed_Per_100k_18Plus: 58105,
    					Distributed_Per_100k_65Plus: 361260,
    					Distributed_Pfizer: 625950,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 1137511,
    					Doses_Distributed: 1321750,
    					LongName: "Utah",
    					Series_Complete_18Plus: 305874,
    					Series_Complete_18PlusPop_Pct: 13.4,
    					Series_Complete_65Plus: 125994,
    					Series_Complete_65PlusPop_Pct: 34.4,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 26503,
    					Series_Complete_Janssen_18Plus: 26481,
    					Series_Complete_Janssen_65Plus: 5717,
    					Series_Complete_Moderna: 137016,
    					Series_Complete_Moderna_18Plus: 136963,
    					Series_Complete_Moderna_65Plus: 47456,
    					Series_Complete_Pfizer: 142934,
    					Series_Complete_Pfizer_18Plus: 142430,
    					Series_Complete_Pfizer_65Plus: 72821,
    					Series_Complete_Pop_Pct: 9.6,
    					Series_Complete_Unk_Manuf: 0,
    					Series_Complete_Unk_Manuf_18Plus: 0,
    					Series_Complete_Unk_Manuf_65Plus: 0,
    					Series_Complete_Yes: 306453,
    					ShortName: "UTA",
    					date_type: "Report",
    					fill: "rgb(255, 247, 251)"
    				}
    			},
    			{
    				arcs: [
    					[
    						-129,
    						137,
    						-127,
    						138,
    						-27,
    						-13,
    						-114,
    						-111,
    						-2,
    						139
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "47",
    					STATENS: "01325873",
    					AFFGEOID: "0400000US47",
    					GEOID: "47",
    					STUSPS: "TN",
    					NAME: "Tennessee",
    					LSAD: "00",
    					ALAND: 106802728188,
    					AWATER: 2350123465,
    					Admin_Per_100K: 32679,
    					Admin_Per_100k_18Plus: 41914,
    					Admin_Per_100k_65Plus: 101500,
    					Administered_18Plus: 2229451,
    					Administered_65Plus: 1160541,
    					Administered_Dose1_Pop_Pct: 21.3,
    					Administered_Dose1_Recip: 1452601,
    					Administered_Dose1_Recip_18Plus: 1450520,
    					Administered_Dose1_Recip_18PlusPop_Pct: 27.3,
    					Administered_Dose1_Recip_65Plus: 712105,
    					Administered_Dose1_Recip_65PlusPop_Pct: 62.3,
    					Administered_Dose2_Pop_Pct: 10.8,
    					Administered_Dose2_Recip: 735541,
    					Administered_Dose2_Recip_18Plus: 735350,
    					Administered_Dose2_Recip_18PlusPop_Pct: 13.8,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 32474,
    					Administered_Moderna: 1062535,
    					Administered_Pfizer: 1134179,
    					Administered_Unk_Manuf: 2551,
    					Census2019: 6829174,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 46066,
    					Distributed_Janssen: 78700,
    					Distributed_Moderna: 1552100,
    					Distributed_Per_100k_18Plus: 59144,
    					Distributed_Per_100k_65Plus: 275142,
    					Distributed_Pfizer: 1515150,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 2231739,
    					Doses_Distributed: 3145950,
    					LongName: "Tennessee",
    					Series_Complete_18Plus: 767853,
    					Series_Complete_18PlusPop_Pct: 14.4,
    					Series_Complete_65Plus: 433898,
    					Series_Complete_65PlusPop_Pct: 37.9,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 32557,
    					Series_Complete_Janssen_18Plus: 32503,
    					Series_Complete_Janssen_65Plus: 6949,
    					Series_Complete_Moderna: 329693,
    					Series_Complete_Moderna_18Plus: 329677,
    					Series_Complete_Moderna_65Plus: 209409,
    					Series_Complete_Pfizer: 405164,
    					Series_Complete_Pfizer_18Plus: 404990,
    					Series_Complete_Pfizer_65Plus: 217071,
    					Series_Complete_Pop_Pct: 11.2,
    					Series_Complete_Unk_Manuf: 684,
    					Series_Complete_Unk_Manuf_18Plus: 683,
    					Series_Complete_Unk_Manuf_65Plus: 469,
    					Series_Complete_Yes: 768098,
    					ShortName: "TNA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						-95,
    						-77,
    						-132,
    						-135,
    						-62,
    						140
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "56",
    					STATENS: "01779807",
    					AFFGEOID: "0400000US56",
    					GEOID: "56",
    					STUSPS: "WY",
    					NAME: "Wyoming",
    					LSAD: "00",
    					ALAND: 251458544898,
    					AWATER: 1867670745,
    					Admin_Per_100K: 38263,
    					Admin_Per_100k_18Plus: 49691,
    					Admin_Per_100k_65Plus: 115635,
    					Administered_18Plus: 221137,
    					Administered_65Plus: 114686,
    					Administered_Dose1_Pop_Pct: 23.3,
    					Administered_Dose1_Recip: 134800,
    					Administered_Dose1_Recip_18Plus: 134541,
    					Administered_Dose1_Recip_18PlusPop_Pct: 30.2,
    					Administered_Dose1_Recip_65Plus: 64831,
    					Administered_Dose1_Recip_65PlusPop_Pct: 65.4,
    					Administered_Dose2_Pop_Pct: 14.4,
    					Administered_Dose2_Recip: 83422,
    					Administered_Dose2_Recip_18Plus: 83362,
    					Administered_Dose2_Recip_18PlusPop_Pct: 18.7,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 2230,
    					Administered_Moderna: 113272,
    					Administered_Pfizer: 105877,
    					Administered_Unk_Manuf: 73,
    					Census2019: 578759,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 54257,
    					Distributed_Janssen: 8200,
    					Distributed_Moderna: 162100,
    					Distributed_Per_100k_18Plus: 70561,
    					Distributed_Per_100k_65Plus: 316614,
    					Distributed_Pfizer: 143715,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 221452,
    					Doses_Distributed: 314015,
    					LongName: "Wyoming",
    					Series_Complete_18Plus: 85495,
    					Series_Complete_18PlusPop_Pct: 19.2,
    					Series_Complete_65Plus: 49765,
    					Series_Complete_65PlusPop_Pct: 50.2,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 2134,
    					Series_Complete_Janssen_18Plus: 2133,
    					Series_Complete_Janssen_65Plus: 474,
    					Series_Complete_Moderna: 42916,
    					Series_Complete_Moderna_18Plus: 42913,
    					Series_Complete_Moderna_65Plus: 25503,
    					Series_Complete_Pfizer: 40494,
    					Series_Complete_Pfizer_18Plus: 40437,
    					Series_Complete_Pfizer_65Plus: 23780,
    					Series_Complete_Pop_Pct: 14.8,
    					Series_Complete_Unk_Manuf: 12,
    					Series_Complete_Unk_Manuf_18Plus: 12,
    					Series_Complete_Unk_Manuf_65Plus: 8,
    					Series_Complete_Yes: 85556,
    					ShortName: "WYA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						[
    							141
    						]
    					],
    					[
    						[
    							142,
    							143,
    							-58,
    							144,
    							145,
    							146,
    							-118
    						]
    					]
    				],
    				type: "MultiPolygon",
    				properties: {
    					STATEFP: "36",
    					STATENS: "01779796",
    					AFFGEOID: "0400000US36",
    					GEOID: "36",
    					STUSPS: "NY",
    					NAME: "New York",
    					LSAD: "00",
    					ALAND: 122049149763,
    					AWATER: 19246994695,
    					Admin_Per_100K: 38671,
    					Admin_Per_100k_18Plus: 48680,
    					Admin_Per_100k_65Plus: 92807,
    					Administered_18Plus: 7509071,
    					Administered_65Plus: 3059056,
    					Administered_Dose1_Pop_Pct: 26.1,
    					Administered_Dose1_Recip: 5082402,
    					Administered_Dose1_Recip_18Plus: 5070608,
    					Administered_Dose1_Recip_18PlusPop_Pct: 32.9,
    					Administered_Dose1_Recip_65Plus: 2016782,
    					Administered_Dose1_Recip_65PlusPop_Pct: 61.2,
    					Administered_Dose2_Pop_Pct: 11.9,
    					Administered_Dose2_Recip: 2319020,
    					Administered_Dose2_Recip_18Plus: 2316787,
    					Administered_Dose2_Recip_18PlusPop_Pct: 15,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 152062,
    					Administered_Moderna: 3584901,
    					Administered_Pfizer: 3785060,
    					Administered_Unk_Manuf: 926,
    					Census2019: 19453561,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 49277,
    					Distributed_Janssen: 246300,
    					Distributed_Moderna: 4497700,
    					Distributed_Per_100k_18Plus: 62145,
    					Distributed_Per_100k_65Plus: 290826,
    					Distributed_Pfizer: 4842045,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 7522949,
    					Doses_Distributed: 9586045,
    					LongName: "New York State",
    					Series_Complete_18Plus: 2467528,
    					Series_Complete_18PlusPop_Pct: 16,
    					Series_Complete_65Plus: 1089959,
    					Series_Complete_65PlusPop_Pct: 33.1,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 150766,
    					Series_Complete_Janssen_18Plus: 150741,
    					Series_Complete_Janssen_65Plus: 48497,
    					Series_Complete_Moderna: 1149522,
    					Series_Complete_Moderna_18Plus: 1149364,
    					Series_Complete_Moderna_65Plus: 515243,
    					Series_Complete_Pfizer: 1169321,
    					Series_Complete_Pfizer_18Plus: 1167246,
    					Series_Complete_Pfizer_65Plus: 526109,
    					Series_Complete_Pop_Pct: 12.7,
    					Series_Complete_Unk_Manuf: 177,
    					Series_Complete_Unk_Manuf_18Plus: 177,
    					Series_Complete_Unk_Manuf_65Plus: 110,
    					Series_Complete_Yes: 2469786,
    					ShortName: "NYA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						-75,
    						-131,
    						-15,
    						-133
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "20",
    					STATENS: "00481813",
    					AFFGEOID: "0400000US20",
    					GEOID: "20",
    					STUSPS: "KS",
    					NAME: "Kansas",
    					LSAD: "00",
    					ALAND: 211755344060,
    					AWATER: 1344141205,
    					Admin_Per_100K: 37115,
    					Admin_Per_100k_18Plus: 48761,
    					Admin_Per_100k_65Plus: 110761,
    					Administered_18Plus: 1079115,
    					Administered_65Plus: 526654,
    					Administered_Dose1_Pop_Pct: 25.5,
    					Administered_Dose1_Recip: 742985,
    					Administered_Dose1_Recip_18Plus: 741279,
    					Administered_Dose1_Recip_18PlusPop_Pct: 33.5,
    					Administered_Dose1_Recip_65Plus: 357816,
    					Administered_Dose1_Recip_65PlusPop_Pct: 75.3,
    					Administered_Dose2_Pop_Pct: 13,
    					Administered_Dose2_Recip: 378203,
    					Administered_Dose2_Recip_18Plus: 377589,
    					Administered_Dose2_Recip_18PlusPop_Pct: 17.1,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 14426,
    					Administered_Moderna: 577156,
    					Administered_Pfizer: 489484,
    					Administered_Unk_Manuf: 208,
    					Census2019: 2913314,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 49799,
    					Distributed_Janssen: 35700,
    					Distributed_Moderna: 729300,
    					Distributed_Per_100k_18Plus: 65557,
    					Distributed_Per_100k_65Plus: 305122,
    					Distributed_Pfizer: 685815,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 1081274,
    					Doses_Distributed: 1450815,
    					LongName: "Kansas",
    					Series_Complete_18Plus: 392599,
    					Series_Complete_18PlusPop_Pct: 17.7,
    					Series_Complete_65Plus: 195171,
    					Series_Complete_65PlusPop_Pct: 41,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 15017,
    					Series_Complete_Janssen_18Plus: 15010,
    					Series_Complete_Janssen_65Plus: 4138,
    					Series_Complete_Moderna: 205018,
    					Series_Complete_Moderna_18Plus: 204997,
    					Series_Complete_Moderna_65Plus: 100303,
    					Series_Complete_Pfizer: 173098,
    					Series_Complete_Pfizer_18Plus: 172505,
    					Series_Complete_Pfizer_65Plus: 90672,
    					Series_Complete_Pop_Pct: 13.5,
    					Series_Complete_Unk_Manuf: 87,
    					Series_Complete_Unk_Manuf_18Plus: 87,
    					Series_Complete_Unk_Manuf_65Plus: 58,
    					Series_Complete_Yes: 393220,
    					ShortName: "KSA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						[
    							147
    						]
    					],
    					[
    						[
    							148
    						]
    					],
    					[
    						[
    							149
    						]
    					],
    					[
    						[
    							150
    						]
    					],
    					[
    						[
    							151
    						]
    					],
    					[
    						[
    							152
    						]
    					],
    					[
    						[
    							153
    						]
    					],
    					[
    						[
    							154
    						]
    					],
    					[
    						[
    							155
    						]
    					],
    					[
    						[
    							156
    						]
    					],
    					[
    						[
    							157
    						]
    					],
    					[
    						[
    							158
    						]
    					],
    					[
    						[
    							159
    						]
    					],
    					[
    						[
    							160
    						]
    					],
    					[
    						[
    							161
    						]
    					],
    					[
    						[
    							162
    						]
    					],
    					[
    						[
    							163
    						]
    					],
    					[
    						[
    							164
    						]
    					],
    					[
    						[
    							165
    						]
    					],
    					[
    						[
    							166
    						]
    					],
    					[
    						[
    							167
    						]
    					],
    					[
    						[
    							168
    						]
    					],
    					[
    						[
    							169
    						]
    					],
    					[
    						[
    							170
    						]
    					]
    				],
    				type: "MultiPolygon",
    				properties: {
    					STATEFP: "02",
    					STATENS: "01785533",
    					AFFGEOID: "0400000US02",
    					GEOID: "02",
    					STUSPS: "AK",
    					NAME: "Alaska",
    					LSAD: "00",
    					ALAND: 1478839695958,
    					AWATER: 245481577452,
    					Admin_Per_100K: 51342,
    					Admin_Per_100k_18Plus: 67233,
    					Admin_Per_100k_65Plus: 127567,
    					Administered_18Plus: 370833,
    					Administered_65Plus: 116836,
    					Administered_Dose1_Pop_Pct: 31.5,
    					Administered_Dose1_Recip: 230614,
    					Administered_Dose1_Recip_18Plus: 227350,
    					Administered_Dose1_Recip_18PlusPop_Pct: 41.2,
    					Administered_Dose1_Recip_65Plus: 64959,
    					Administered_Dose1_Recip_65PlusPop_Pct: 70.9,
    					Administered_Dose2_Pop_Pct: 19.7,
    					Administered_Dose2_Recip: 144041,
    					Administered_Dose2_Recip_18Plus: 142554,
    					Administered_Dose2_Recip_18PlusPop_Pct: 25.8,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 2890,
    					Administered_Moderna: 171914,
    					Administered_Pfizer: 200730,
    					Administered_Unk_Manuf: 56,
    					Census2019: 731545,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 71176,
    					Distributed_Janssen: 11700,
    					Distributed_Moderna: 247100,
    					Distributed_Per_100k_18Plus: 94402,
    					Distributed_Per_100k_65Plus: 568508,
    					Distributed_Pfizer: 261885,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 375590,
    					Doses_Distributed: 520685,
    					LongName: "Alaska",
    					Series_Complete_18Plus: 145407,
    					Series_Complete_18PlusPop_Pct: 26.4,
    					Series_Complete_65Plus: 53588,
    					Series_Complete_65PlusPop_Pct: 58.5,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 2862,
    					Series_Complete_Janssen_18Plus: 2853,
    					Series_Complete_Janssen_65Plus: 325,
    					Series_Complete_Moderna: 64959,
    					Series_Complete_Moderna_18Plus: 64895,
    					Series_Complete_Moderna_65Plus: 31548,
    					Series_Complete_Pfizer: 79074,
    					Series_Complete_Pfizer_18Plus: 77651,
    					Series_Complete_Pfizer_65Plus: 21712,
    					Series_Complete_Pop_Pct: 20.1,
    					Series_Complete_Unk_Manuf: 8,
    					Series_Complete_Unk_Manuf_18Plus: 8,
    					Series_Complete_Unk_Manuf_65Plus: 3,
    					Series_Complete_Yes: 146903,
    					ShortName: "AKA",
    					date_type: "Report",
    					fill: "rgb(213, 213, 232)"
    				}
    			},
    			{
    				arcs: [
    					[
    						171,
    						-64,
    						-137,
    						172,
    						-107
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "32",
    					STATENS: "01779793",
    					AFFGEOID: "0400000US32",
    					GEOID: "32",
    					STUSPS: "NV",
    					NAME: "Nevada",
    					LSAD: "00",
    					ALAND: 284329506470,
    					AWATER: 2047206072,
    					Admin_Per_100K: 37821,
    					Admin_Per_100k_18Plus: 48745,
    					Admin_Per_100k_65Plus: 110464,
    					Administered_18Plus: 1163786,
    					Administered_65Plus: 547872,
    					Administered_Dose1_Pop_Pct: 24.1,
    					Administered_Dose1_Recip: 742578,
    					Administered_Dose1_Recip_18Plus: 741721,
    					Administered_Dose1_Recip_18PlusPop_Pct: 31.1,
    					Administered_Dose1_Recip_65Plus: 328891,
    					Administered_Dose1_Recip_65PlusPop_Pct: 66.3,
    					Administered_Dose2_Pop_Pct: 12.8,
    					Administered_Dose2_Recip: 395146,
    					Administered_Dose2_Recip_18Plus: 394881,
    					Administered_Dose2_Recip_18PlusPop_Pct: 16.5,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 22144,
    					Administered_Moderna: 521714,
    					Administered_Pfizer: 621081,
    					Administered_Unk_Manuf: 0,
    					Census2019: 3080156,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 43785,
    					Distributed_Janssen: 36100,
    					Distributed_Moderna: 663200,
    					Distributed_Per_100k_18Plus: 56488,
    					Distributed_Per_100k_65Plus: 271921,
    					Distributed_Pfizer: 649350,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 1164939,
    					Doses_Distributed: 1348650,
    					LongName: "Nevada",
    					Series_Complete_18Plus: 416800,
    					Series_Complete_18PlusPop_Pct: 17.5,
    					Series_Complete_65Plus: 212180,
    					Series_Complete_65PlusPop_Pct: 42.8,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 21921,
    					Series_Complete_Janssen_18Plus: 21919,
    					Series_Complete_Janssen_65Plus: 7353,
    					Series_Complete_Moderna: 179520,
    					Series_Complete_Moderna_18Plus: 179500,
    					Series_Complete_Moderna_65Plus: 93721,
    					Series_Complete_Pfizer: 215625,
    					Series_Complete_Pfizer_18Plus: 215380,
    					Series_Complete_Pfizer_65Plus: 111106,
    					Series_Complete_Pop_Pct: 13.5,
    					Series_Complete_Unk_Manuf: 1,
    					Series_Complete_Unk_Manuf_18Plus: 1,
    					Series_Complete_Unk_Manuf_65Plus: 0,
    					Series_Complete_Yes: 417067,
    					ShortName: "NVA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						173,
    						174,
    						175,
    						176,
    						177,
    						-125
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "17",
    					STATENS: "01779784",
    					AFFGEOID: "0400000US17",
    					GEOID: "17",
    					STUSPS: "IL",
    					NAME: "Illinois",
    					LSAD: "00",
    					ALAND: 143780567633,
    					AWATER: 6214824948,
    					Admin_Per_100K: 39863,
    					Admin_Per_100k_18Plus: 51146,
    					Admin_Per_100k_65Plus: 106563,
    					Administered_18Plus: 5039901,
    					Administered_65Plus: 2177327,
    					Administered_Dose1_Pop_Pct: 26.1,
    					Administered_Dose1_Recip: 3307733,
    					Administered_Dose1_Recip_18Plus: 3298959,
    					Administered_Dose1_Recip_18PlusPop_Pct: 33.5,
    					Administered_Dose1_Recip_65Plus: 1395559,
    					Administered_Dose1_Recip_65PlusPop_Pct: 68.3,
    					Administered_Dose2_Pop_Pct: 13.5,
    					Administered_Dose2_Recip: 1711971,
    					Administered_Dose2_Recip_18Plus: 1709368,
    					Administered_Dose2_Recip_18PlusPop_Pct: 17.3,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 88256,
    					Administered_Moderna: 2440085,
    					Administered_Pfizer: 2520998,
    					Administered_Unk_Manuf: 2043,
    					Census2019: 12671821,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 46634,
    					Distributed_Janssen: 158000,
    					Distributed_Moderna: 2839100,
    					Distributed_Per_100k_18Plus: 59970,
    					Distributed_Per_100k_65Plus: 289219,
    					Distributed_Pfizer: 2912325,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 5051382,
    					Doses_Distributed: 5909425,
    					LongName: "Illinois",
    					Series_Complete_18Plus: 1795201,
    					Series_Complete_18PlusPop_Pct: 18.2,
    					Series_Complete_65Plus: 805289,
    					Series_Complete_65PlusPop_Pct: 39.4,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 85988,
    					Series_Complete_Janssen_18Plus: 85833,
    					Series_Complete_Janssen_65Plus: 20074,
    					Series_Complete_Moderna: 830958,
    					Series_Complete_Moderna_18Plus: 830735,
    					Series_Complete_Moderna_65Plus: 394190,
    					Series_Complete_Pfizer: 880363,
    					Series_Complete_Pfizer_18Plus: 877984,
    					Series_Complete_Pfizer_65Plus: 390601,
    					Series_Complete_Pop_Pct: 14.2,
    					Series_Complete_Unk_Manuf: 650,
    					Series_Complete_Unk_Manuf_18Plus: 649,
    					Series_Complete_Unk_Manuf_65Plus: 424,
    					Series_Complete_Yes: 1797959,
    					ShortName: "ILA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						178,
    						179,
    						-51,
    						-144
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "50",
    					STATENS: "01779802",
    					AFFGEOID: "0400000US50",
    					GEOID: "50",
    					STUSPS: "VT",
    					NAME: "Vermont",
    					LSAD: "00",
    					ALAND: 23874175944,
    					AWATER: 1030416650,
    					Admin_Per_100K: 44459,
    					Admin_Per_100k_18Plus: 54318,
    					Admin_Per_100k_65Plus: 120516,
    					Administered_18Plus: 277011,
    					Administered_65Plus: 150692,
    					Administered_Dose1_Pop_Pct: 28.8,
    					Administered_Dose1_Recip: 179725,
    					Administered_Dose1_Recip_18Plus: 179449,
    					Administered_Dose1_Recip_18PlusPop_Pct: 35.2,
    					Administered_Dose1_Recip_65Plus: 101989,
    					Administered_Dose1_Recip_65PlusPop_Pct: 81.6,
    					Administered_Dose2_Pop_Pct: 14.6,
    					Administered_Dose2_Recip: 91304,
    					Administered_Dose2_Recip_18Plus: 91170,
    					Administered_Dose2_Recip_18PlusPop_Pct: 17.9,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 2901,
    					Administered_Moderna: 138508,
    					Administered_Pfizer: 135780,
    					Administered_Unk_Manuf: 231,
    					Census2019: 623989,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 54963,
    					Distributed_Janssen: 9100,
    					Distributed_Moderna: 172400,
    					Distributed_Per_100k_18Plus: 67249,
    					Distributed_Per_100k_65Plus: 274282,
    					Distributed_Pfizer: 161460,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 277420,
    					Doses_Distributed: 342960,
    					LongName: "Vermont",
    					Series_Complete_18Plus: 94029,
    					Series_Complete_18PlusPop_Pct: 18.4,
    					Series_Complete_65Plus: 44944,
    					Series_Complete_65PlusPop_Pct: 35.9,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 2862,
    					Series_Complete_Janssen_18Plus: 2859,
    					Series_Complete_Janssen_65Plus: 56,
    					Series_Complete_Moderna: 45399,
    					Series_Complete_Moderna_18Plus: 45388,
    					Series_Complete_Moderna_65Plus: 19317,
    					Series_Complete_Pfizer: 45840,
    					Series_Complete_Pfizer_18Plus: 45717,
    					Series_Complete_Pfizer_65Plus: 25529,
    					Series_Complete_Pop_Pct: 15.1,
    					Series_Complete_Unk_Manuf: 65,
    					Series_Complete_Unk_Manuf_18Plus: 65,
    					Series_Complete_Unk_Manuf_65Plus: 42,
    					Series_Complete_Yes: 94166,
    					ShortName: "VTA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						180,
    						181,
    						-91,
    						-141,
    						-61
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "30",
    					STATENS: "00767982",
    					AFFGEOID: "0400000US30",
    					GEOID: "30",
    					STUSPS: "MT",
    					NAME: "Montana",
    					LSAD: "00",
    					ALAND: 376962738765,
    					AWATER: 3869208832,
    					Admin_Per_100K: 41887,
    					Admin_Per_100k_18Plus: 53121,
    					Admin_Per_100k_65Plus: 109112,
    					Administered_18Plus: 446315,
    					Administered_65Plus: 225248,
    					Administered_Dose1_Pop_Pct: 26.6,
    					Administered_Dose1_Recip: 284626,
    					Administered_Dose1_Recip_18Plus: 283600,
    					Administered_Dose1_Recip_18PlusPop_Pct: 33.8,
    					Administered_Dose1_Recip_65Plus: 137042,
    					Administered_Dose1_Recip_65PlusPop_Pct: 66.4,
    					Administered_Dose2_Pop_Pct: 15.3,
    					Administered_Dose2_Recip: 163652,
    					Administered_Dose2_Recip_18Plus: 163333,
    					Administered_Dose2_Recip_18PlusPop_Pct: 19.4,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 6911,
    					Administered_Moderna: 237240,
    					Administered_Pfizer: 203414,
    					Administered_Unk_Manuf: 110,
    					Census2019: 1068778,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 51585,
    					Distributed_Janssen: 14500,
    					Distributed_Moderna: 288200,
    					Distributed_Per_100k_18Plus: 65619,
    					Distributed_Per_100k_65Plus: 267067,
    					Distributed_Pfizer: 248625,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 447675,
    					Doses_Distributed: 551325,
    					LongName: "Montana",
    					Series_Complete_18Plus: 170204,
    					Series_Complete_18PlusPop_Pct: 20.3,
    					Series_Complete_65Plus: 92022,
    					Series_Complete_65PlusPop_Pct: 44.6,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 6874,
    					Series_Complete_Janssen_18Plus: 6871,
    					Series_Complete_Janssen_65Plus: 2122,
    					Series_Complete_Moderna: 87643,
    					Series_Complete_Moderna_18Plus: 87624,
    					Series_Complete_Moderna_65Plus: 44694,
    					Series_Complete_Pfizer: 75981,
    					Series_Complete_Pfizer_18Plus: 75681,
    					Series_Complete_Pfizer_65Plus: 45192,
    					Series_Complete_Pop_Pct: 16,
    					Series_Complete_Unk_Manuf: 28,
    					Series_Complete_Unk_Manuf_18Plus: 28,
    					Series_Complete_Unk_Manuf_65Plus: 14,
    					Series_Complete_Yes: 170526,
    					ShortName: "MTA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						182,
    						183,
    						-174,
    						-124,
    						-73,
    						-94
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "19",
    					STATENS: "01779785",
    					AFFGEOID: "0400000US19",
    					GEOID: "19",
    					STUSPS: "IA",
    					NAME: "Iowa",
    					LSAD: "00",
    					ALAND: 144661267977,
    					AWATER: 1084180812,
    					Admin_Per_100K: 41992,
    					Admin_Per_100k_18Plus: 54457,
    					Admin_Per_100k_65Plus: 123848,
    					Administered_18Plus: 1322334,
    					Administered_65Plus: 684824,
    					Administered_Dose1_Pop_Pct: 26.8,
    					Administered_Dose1_Recip: 846801,
    					Administered_Dose1_Recip_18Plus: 845015,
    					Administered_Dose1_Recip_18PlusPop_Pct: 34.8,
    					Administered_Dose1_Recip_65Plus: 421553,
    					Administered_Dose1_Recip_65PlusPop_Pct: 76.2,
    					Administered_Dose2_Pop_Pct: 15.2,
    					Administered_Dose2_Recip: 478758,
    					Administered_Dose2_Recip_18Plus: 477958,
    					Administered_Dose2_Recip_18PlusPop_Pct: 19.7,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 34463,
    					Administered_Moderna: 698310,
    					Administered_Pfizer: 591999,
    					Administered_Unk_Manuf: 119,
    					Census2019: 3155070,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 46979,
    					Distributed_Janssen: 40100,
    					Distributed_Moderna: 752800,
    					Distributed_Per_100k_18Plus: 61041,
    					Distributed_Per_100k_65Plus: 268056,
    					Distributed_Pfizer: 689325,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 1324891,
    					Doses_Distributed: 1482225,
    					LongName: "Iowa",
    					Series_Complete_18Plus: 512671,
    					Series_Complete_18PlusPop_Pct: 21.1,
    					Series_Complete_65Plus: 266429,
    					Series_Complete_65PlusPop_Pct: 48.2,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 34724,
    					Series_Complete_Janssen_18Plus: 34713,
    					Series_Complete_Janssen_65Plus: 2833,
    					Series_Complete_Moderna: 260567,
    					Series_Complete_Moderna_18Plus: 260557,
    					Series_Complete_Moderna_65Plus: 135503,
    					Series_Complete_Pfizer: 218177,
    					Series_Complete_Pfizer_18Plus: 217387,
    					Series_Complete_Pfizer_65Plus: 128085,
    					Series_Complete_Pop_Pct: 16.3,
    					Series_Complete_Unk_Manuf: 14,
    					Series_Complete_Unk_Manuf_18Plus: 14,
    					Series_Complete_Unk_Manuf_65Plus: 8,
    					Series_Complete_Yes: 513482,
    					ShortName: "IAA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						-11,
    						184,
    						-115
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "45",
    					STATENS: "01779799",
    					AFFGEOID: "0400000US45",
    					GEOID: "45",
    					STUSPS: "SC",
    					NAME: "South Carolina",
    					LSAD: "00",
    					ALAND: 77864918488,
    					AWATER: 5075218778,
    					Admin_Per_100K: 35639,
    					Admin_Per_100k_18Plus: 45386,
    					Admin_Per_100k_65Plus: 115600,
    					Administered_18Plus: 1832461,
    					Administered_65Plus: 1083197,
    					Administered_Dose1_Pop_Pct: 23.3,
    					Administered_Dose1_Recip: 1199352,
    					Administered_Dose1_Recip_18Plus: 1197296,
    					Administered_Dose1_Recip_18PlusPop_Pct: 29.7,
    					Administered_Dose1_Recip_65Plus: 656248,
    					Administered_Dose1_Recip_65PlusPop_Pct: 70,
    					Administered_Dose2_Pop_Pct: 12.1,
    					Administered_Dose2_Recip: 623883,
    					Administered_Dose2_Recip_18Plus: 623453,
    					Administered_Dose2_Recip_18PlusPop_Pct: 15.4,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 33297,
    					Administered_Moderna: 693664,
    					Administered_Pfizer: 1106980,
    					Administered_Unk_Manuf: 1024,
    					Census2019: 5148714,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 43413,
    					Distributed_Janssen: 67200,
    					Distributed_Moderna: 999400,
    					Distributed_Per_100k_18Plus: 55361,
    					Distributed_Per_100k_65Plus: 238546,
    					Distributed_Pfizer: 1168635,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 1834965,
    					Doses_Distributed: 2235235,
    					LongName: "South Carolina",
    					Series_Complete_18Plus: 656107,
    					Series_Complete_18PlusPop_Pct: 16.3,
    					Series_Complete_65Plus: 433484,
    					Series_Complete_65PlusPop_Pct: 46.3,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 32680,
    					Series_Complete_Janssen_18Plus: 32654,
    					Series_Complete_Janssen_65Plus: 6748,
    					Series_Complete_Moderna: 205257,
    					Series_Complete_Moderna_18Plus: 205228,
    					Series_Complete_Moderna_65Plus: 155748,
    					Series_Complete_Pfizer: 418423,
    					Series_Complete_Pfizer_18Plus: 418022,
    					Series_Complete_Pfizer_65Plus: 270849,
    					Series_Complete_Pop_Pct: 12.8,
    					Series_Complete_Unk_Manuf: 203,
    					Series_Complete_Unk_Manuf_18Plus: 203,
    					Series_Complete_Unk_Manuf_65Plus: 139,
    					Series_Complete_Yes: 656563,
    					ShortName: "SCA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						185,
    						186,
    						187,
    						-52,
    						-180
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "33",
    					STATENS: "01779794",
    					AFFGEOID: "0400000US33",
    					GEOID: "33",
    					STUSPS: "NH",
    					NAME: "New Hampshire",
    					LSAD: "00",
    					ALAND: 23189413166,
    					AWATER: 1026675248,
    					Admin_Per_100K: 39536,
    					Admin_Per_100k_18Plus: 48540,
    					Admin_Per_100k_65Plus: 110058,
    					Administered_18Plus: 536101,
    					Administered_65Plus: 279398,
    					Administered_Dose1_Pop_Pct: 28,
    					Administered_Dose1_Recip: 380950,
    					Administered_Dose1_Recip_18Plus: 379832,
    					Administered_Dose1_Recip_18PlusPop_Pct: 34.4,
    					Administered_Dose1_Recip_65Plus: 204177,
    					Administered_Dose1_Recip_65PlusPop_Pct: 80.4,
    					Administered_Dose2_Pop_Pct: 13,
    					Administered_Dose2_Recip: 176864,
    					Administered_Dose2_Recip_18Plus: 176528,
    					Administered_Dose2_Recip_18PlusPop_Pct: 16,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 13162,
    					Administered_Moderna: 291607,
    					Administered_Pfizer: 232781,
    					Administered_Unk_Manuf: 27,
    					Census2019: 1359711,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 47937,
    					Distributed_Janssen: 19500,
    					Distributed_Moderna: 332200,
    					Distributed_Per_100k_18Plus: 59016,
    					Distributed_Per_100k_65Plus: 256754,
    					Distributed_Pfizer: 300105,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 537577,
    					Doses_Distributed: 651805,
    					LongName: "New Hampshire",
    					Series_Complete_18Plus: 190123,
    					Series_Complete_18PlusPop_Pct: 17.2,
    					Series_Complete_65Plus: 93200,
    					Series_Complete_65PlusPop_Pct: 36.7,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 13609,
    					Series_Complete_Janssen_18Plus: 13595,
    					Series_Complete_Janssen_65Plus: 8417,
    					Series_Complete_Moderna: 108759,
    					Series_Complete_Moderna_18Plus: 108682,
    					Series_Complete_Moderna_65Plus: 50009,
    					Series_Complete_Pfizer: 68100,
    					Series_Complete_Pfizer_18Plus: 67841,
    					Series_Complete_Pfizer_65Plus: 34772,
    					Series_Complete_Pop_Pct: 14,
    					Series_Complete_Unk_Manuf: 5,
    					Series_Complete_Unk_Manuf_18Plus: 5,
    					Series_Complete_Unk_Manuf_65Plus: 2,
    					Series_Complete_Yes: 190473,
    					ShortName: "NHA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						-108,
    						-173,
    						-136,
    						-90,
    						188
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "04",
    					STATENS: "01779777",
    					AFFGEOID: "0400000US04",
    					GEOID: "04",
    					STUSPS: "AZ",
    					NAME: "Arizona",
    					LSAD: "00",
    					ALAND: 294198551143,
    					AWATER: 1027337603,
    					Admin_Per_100K: 40432,
    					Admin_Per_100k_18Plus: 52012,
    					Admin_Per_100k_65Plus: 112605,
    					Administered_18Plus: 2932711,
    					Administered_65Plus: 1473588,
    					Administered_Dose1_Pop_Pct: 25.2,
    					Administered_Dose1_Recip: 1835039,
    					Administered_Dose1_Recip_18Plus: 1829129,
    					Administered_Dose1_Recip_18PlusPop_Pct: 32.4,
    					Administered_Dose1_Recip_65Plus: 879526,
    					Administered_Dose1_Recip_65PlusPop_Pct: 67.2,
    					Administered_Dose2_Pop_Pct: 14,
    					Administered_Dose2_Recip: 1022297,
    					Administered_Dose2_Recip_18Plus: 1019510,
    					Administered_Dose2_Recip_18PlusPop_Pct: 18.1,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 28307,
    					Administered_Moderna: 1360133,
    					Administered_Pfizer: 1553435,
    					Administered_Unk_Manuf: 1032,
    					Census2019: 7278717,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 47553,
    					Distributed_Janssen: 84100,
    					Distributed_Moderna: 1662900,
    					Distributed_Per_100k_18Plus: 61386,
    					Distributed_Per_100k_65Plus: 264493,
    					Distributed_Pfizer: 1714245,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 2942907,
    					Doses_Distributed: 3461245,
    					LongName: "Arizona",
    					Series_Complete_18Plus: 1046398,
    					Series_Complete_18PlusPop_Pct: 18.6,
    					Series_Complete_65Plus: 548550,
    					Series_Complete_65PlusPop_Pct: 41.9,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 26922,
    					Series_Complete_Janssen_18Plus: 26888,
    					Series_Complete_Janssen_65Plus: 7866,
    					Series_Complete_Moderna: 461777,
    					Series_Complete_Moderna_18Plus: 461716,
    					Series_Complete_Moderna_65Plus: 251576,
    					Series_Complete_Pfizer: 560154,
    					Series_Complete_Pfizer_18Plus: 557428,
    					Series_Complete_Pfizer_65Plus: 288857,
    					Series_Complete_Pop_Pct: 14.4,
    					Series_Complete_Unk_Manuf: 366,
    					Series_Complete_Unk_Manuf_18Plus: 366,
    					Series_Complete_Unk_Manuf_65Plus: 251,
    					Series_Complete_Yes: 1049219,
    					ShortName: "AZA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						189,
    						-24
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "11",
    					STATENS: "01702382",
    					AFFGEOID: "0400000US11",
    					GEOID: "11",
    					STUSPS: "DC",
    					NAME: "District of Columbia",
    					LSAD: "00",
    					ALAND: 158340391,
    					AWATER: 18687198,
    					Admin_Per_100K: 43499,
    					Admin_Per_100k_18Plus: 53074,
    					Admin_Per_100k_65Plus: 129794,
    					Administered_18Plus: 306546,
    					Administered_65Plus: 113366,
    					Administered_Dose1_Pop_Pct: 21.3,
    					Administered_Dose1_Recip: 150379,
    					Administered_Dose1_Recip_18Plus: 149954,
    					Administered_Dose1_Recip_18PlusPop_Pct: 26,
    					Administered_Dose1_Recip_65Plus: 55403,
    					Administered_Dose1_Recip_65PlusPop_Pct: 63.4,
    					Administered_Dose2_Pop_Pct: 9.9,
    					Administered_Dose2_Recip: 69838,
    					Administered_Dose2_Recip_18Plus: 69820,
    					Administered_Dose2_Recip_18PlusPop_Pct: 12.1,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 3864,
    					Administered_Moderna: 125578,
    					Administered_Pfizer: 177554,
    					Administered_Unk_Manuf: 0,
    					Census2019: 705749,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 63142,
    					Distributed_Janssen: 12000,
    					Distributed_Moderna: 196700,
    					Distributed_Per_100k_18Plus: 77154,
    					Distributed_Per_100k_65Plus: 510201,
    					Distributed_Pfizer: 236925,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 306996,
    					Doses_Distributed: 445625,
    					LongName: "District of Columbia",
    					Series_Complete_18Plus: 74443,
    					Series_Complete_18PlusPop_Pct: 12.9,
    					Series_Complete_65Plus: 34636,
    					Series_Complete_65PlusPop_Pct: 39.7,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 4623,
    					Series_Complete_Janssen_18Plus: 4623,
    					Series_Complete_Janssen_65Plus: 170,
    					Series_Complete_Moderna: 34788,
    					Series_Complete_Moderna_18Plus: 34787,
    					Series_Complete_Moderna_65Plus: 20226,
    					Series_Complete_Pfizer: 35037,
    					Series_Complete_Pfizer_18Plus: 35020,
    					Series_Complete_Pfizer_65Plus: 14234,
    					Series_Complete_Pop_Pct: 10.6,
    					Series_Complete_Unk_Manuf: 13,
    					Series_Complete_Unk_Manuf_18Plus: 13,
    					Series_Complete_Unk_Manuf_65Plus: 6,
    					Series_Complete_Yes: 74461,
    					ShortName: "DCA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				type: null,
    				properties: {
    					STATEFP: "60",
    					STATENS: "01802701",
    					AFFGEOID: "0400000US60",
    					GEOID: "60",
    					STUSPS: "AS",
    					NAME: "American Samoa",
    					LSAD: "00",
    					ALAND: 197759063,
    					AWATER: 1307243754,
    					Admin_Per_100K: 48510,
    					Admin_Per_100k_18Plus: 60382,
    					Admin_Per_100k_65Plus: 37816,
    					Administered_18Plus: 26228,
    					Administered_65Plus: 3580,
    					Administered_Dose1_Pop_Pct: 30.4,
    					Administered_Dose1_Recip: 16916,
    					Administered_Dose1_Recip_18Plus: 16403,
    					Administered_Dose1_Recip_18PlusPop_Pct: 37.8,
    					Administered_Dose1_Recip_65Plus: 2134,
    					Administered_Dose1_Recip_65PlusPop_Pct: 22.5,
    					Administered_Dose2_Pop_Pct: 18.3,
    					Administered_Dose2_Recip: 10193,
    					Administered_Dose2_Recip_18Plus: 9921,
    					Administered_Dose2_Recip_18PlusPop_Pct: 22.8,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 0,
    					Administered_Moderna: 5888,
    					Administered_Pfizer: 21127,
    					Administered_Unk_Manuf: 0,
    					Census2019: 55689,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 77592,
    					Distributed_Janssen: 0,
    					Distributed_Moderna: 12400,
    					Distributed_Per_100k_18Plus: 99477,
    					Distributed_Per_100k_65Plus: 456428,
    					Distributed_Pfizer: 30810,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 27015,
    					Doses_Distributed: 43210,
    					LongName: "American Samoa",
    					Series_Complete_18Plus: 9924,
    					Series_Complete_18PlusPop_Pct: 22.8,
    					Series_Complete_65Plus: 1502,
    					Series_Complete_65PlusPop_Pct: 15.9,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 3,
    					Series_Complete_Janssen_18Plus: 3,
    					Series_Complete_Janssen_65Plus: 1,
    					Series_Complete_Moderna: 2200,
    					Series_Complete_Moderna_18Plus: 2199,
    					Series_Complete_Moderna_65Plus: 584,
    					Series_Complete_Pfizer: 7993,
    					Series_Complete_Pfizer_18Plus: 7722,
    					Series_Complete_Pfizer_65Plus: 917,
    					Series_Complete_Pop_Pct: 18.3,
    					Series_Complete_Unk_Manuf: 0,
    					Series_Complete_Unk_Manuf_18Plus: 0,
    					Series_Complete_Unk_Manuf_65Plus: 0,
    					Series_Complete_Yes: 10196,
    					ShortName: "ASA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				type: null,
    				properties: {
    					STATEFP: "78",
    					STATENS: "01802710",
    					AFFGEOID: "0400000US78",
    					GEOID: "78",
    					STUSPS: "VI",
    					NAME: "United States Virgin Islands",
    					LSAD: "00",
    					ALAND: 348021896,
    					AWATER: 1550236201,
    					Admin_Per_100K: 30752,
    					Admin_Per_100k_18Plus: 39204,
    					Admin_Per_100k_65Plus: 68307,
    					Administered_18Plus: 32010,
    					Administered_65Plus: 12156,
    					Administered_Dose1_Pop_Pct: 19.8,
    					Administered_Dose1_Recip: 20720,
    					Administered_Dose1_Recip_18Plus: 20573,
    					Administered_Dose1_Recip_18PlusPop_Pct: 25.2,
    					Administered_Dose1_Recip_65Plus: 7543,
    					Administered_Dose1_Recip_65PlusPop_Pct: 42.4,
    					Administered_Dose2_Pop_Pct: 9.8,
    					Administered_Dose2_Recip: 10282,
    					Administered_Dose2_Recip_18Plus: 10271,
    					Administered_Dose2_Recip_18PlusPop_Pct: 12.6,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 0,
    					Administered_Moderna: 13573,
    					Administered_Pfizer: 18618,
    					Administered_Unk_Manuf: 0,
    					Census2019: 104680,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 44708,
    					Distributed_Janssen: 400,
    					Distributed_Moderna: 19100,
    					Distributed_Per_100k_18Plus: 57318,
    					Distributed_Per_100k_65Plus: 262980,
    					Distributed_Pfizer: 27300,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 32191,
    					Doses_Distributed: 46800,
    					LongName: "Virgin Islands",
    					Series_Complete_18Plus: 10277,
    					Series_Complete_18PlusPop_Pct: 12.6,
    					Series_Complete_65Plus: 4525,
    					Series_Complete_65PlusPop_Pct: 25.4,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 6,
    					Series_Complete_Janssen_18Plus: 6,
    					Series_Complete_Janssen_65Plus: 5,
    					Series_Complete_Moderna: 5378,
    					Series_Complete_Moderna_18Plus: 5373,
    					Series_Complete_Moderna_65Plus: 2601,
    					Series_Complete_Pfizer: 4904,
    					Series_Complete_Pfizer_18Plus: 4898,
    					Series_Complete_Pfizer_65Plus: 1919,
    					Series_Complete_Pop_Pct: 9.8,
    					Series_Complete_Unk_Manuf: 0,
    					Series_Complete_Unk_Manuf_18Plus: 0,
    					Series_Complete_Unk_Manuf_65Plus: 0,
    					Series_Complete_Yes: 10288,
    					ShortName: "VIA",
    					date_type: "Report",
    					fill: "rgb(255, 247, 251)"
    				}
    			},
    			{
    				arcs: [
    					[
    						-119,
    						-147,
    						190
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "34",
    					STATENS: "01779795",
    					AFFGEOID: "0400000US34",
    					GEOID: "34",
    					STUSPS: "NJ",
    					NAME: "New Jersey",
    					LSAD: "00",
    					ALAND: 19047825980,
    					AWATER: 3544860246,
    					Admin_Per_100K: 40930,
    					Admin_Per_100k_18Plus: 52186,
    					Admin_Per_100k_65Plus: 97780,
    					Administered_18Plus: 3623562,
    					Administered_65Plus: 1442781,
    					Administered_Dose1_Pop_Pct: 28.3,
    					Administered_Dose1_Recip: 2510167,
    					Administered_Dose1_Recip_18Plus: 2500999,
    					Administered_Dose1_Recip_18PlusPop_Pct: 36,
    					Administered_Dose1_Recip_65Plus: 958137,
    					Administered_Dose1_Recip_65PlusPop_Pct: 64.9,
    					Administered_Dose2_Pop_Pct: 13.9,
    					Administered_Dose2_Recip: 1236568,
    					Administered_Dose2_Recip_18Plus: 1233769,
    					Administered_Dose2_Recip_18PlusPop_Pct: 17.8,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 71602,
    					Administered_Moderna: 1808713,
    					Administered_Pfizer: 1754714,
    					Administered_Unk_Manuf: 475,
    					Census2019: 8882190,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 46695,
    					Distributed_Janssen: 108900,
    					Distributed_Moderna: 1982400,
    					Distributed_Per_100k_18Plus: 59732,
    					Distributed_Per_100k_65Plus: 281090,
    					Distributed_Pfizer: 2056275,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 3635504,
    					Doses_Distributed: 4147575,
    					LongName: "New Jersey",
    					Series_Complete_18Plus: 1305150,
    					Series_Complete_18PlusPop_Pct: 18.8,
    					Series_Complete_65Plus: 541945,
    					Series_Complete_65PlusPop_Pct: 36.7,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 71401,
    					Series_Complete_Janssen_18Plus: 71381,
    					Series_Complete_Janssen_65Plus: 20499,
    					Series_Complete_Moderna: 604086,
    					Series_Complete_Moderna_18Plus: 604001,
    					Series_Complete_Moderna_65Plus: 246449,
    					Series_Complete_Pfizer: 632476,
    					Series_Complete_Pfizer_18Plus: 629762,
    					Series_Complete_Pfizer_65Plus: 274993,
    					Series_Complete_Pop_Pct: 14.7,
    					Series_Complete_Unk_Manuf: 6,
    					Series_Complete_Unk_Manuf_18Plus: 6,
    					Series_Complete_Unk_Manuf_65Plus: 4,
    					Series_Complete_Yes: 1307969,
    					ShortName: "NJA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						[
    							191
    						]
    					],
    					[
    						[
    							-122,
    							192,
    							193,
    							-20,
    							194,
    							-25,
    							-190,
    							-23,
    							-31
    						]
    					]
    				],
    				type: "MultiPolygon",
    				properties: {
    					STATEFP: "24",
    					STATENS: "01714934",
    					AFFGEOID: "0400000US24",
    					GEOID: "24",
    					STUSPS: "MD",
    					NAME: "Maryland",
    					LSAD: "00",
    					ALAND: 25151100280,
    					AWATER: 6979966958,
    					Admin_Per_100K: 38376,
    					Admin_Per_100k_18Plus: 49157,
    					Admin_Per_100k_65Plus: 104256,
    					Administered_18Plus: 2315789,
    					Administered_65Plus: 1000231,
    					Administered_Dose1_Pop_Pct: 25.9,
    					Administered_Dose1_Recip: 1567725,
    					Administered_Dose1_Recip_18Plus: 1564214,
    					Administered_Dose1_Recip_18PlusPop_Pct: 33.2,
    					Administered_Dose1_Recip_65Plus: 669699,
    					Administered_Dose1_Recip_65PlusPop_Pct: 69.8,
    					Administered_Dose2_Pop_Pct: 13.2,
    					Administered_Dose2_Recip: 796266,
    					Administered_Dose2_Recip_18Plus: 795489,
    					Administered_Dose2_Recip_18PlusPop_Pct: 16.9,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 57602,
    					Administered_Moderna: 1124405,
    					Administered_Pfizer: 1136644,
    					Administered_Unk_Manuf: 1422,
    					Census2019: 6045680,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 47410,
    					Distributed_Janssen: 78700,
    					Distributed_Moderna: 1342600,
    					Distributed_Per_100k_18Plus: 60842,
    					Distributed_Per_100k_65Plus: 298756,
    					Distributed_Pfizer: 1444950,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 2320073,
    					Doses_Distributed: 2866250,
    					LongName: "Maryland",
    					Series_Complete_18Plus: 852025,
    					Series_Complete_18PlusPop_Pct: 18.1,
    					Series_Complete_65Plus: 370996,
    					Series_Complete_65PlusPop_Pct: 38.7,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 56548,
    					Series_Complete_Janssen_18Plus: 56536,
    					Series_Complete_Janssen_65Plus: 22778,
    					Series_Complete_Moderna: 385186,
    					Series_Complete_Moderna_18Plus: 385142,
    					Series_Complete_Moderna_65Plus: 169167,
    					Series_Complete_Pfizer: 410693,
    					Series_Complete_Pfizer_18Plus: 409960,
    					Series_Complete_Pfizer_65Plus: 178872,
    					Series_Complete_Pop_Pct: 14.1,
    					Series_Complete_Unk_Manuf: 387,
    					Series_Complete_Unk_Manuf_18Plus: 387,
    					Series_Complete_Unk_Manuf_65Plus: 179,
    					Series_Complete_Yes: 852814,
    					ShortName: "MDA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						[
    							195
    						]
    					],
    					[
    						[
    							196
    						]
    					],
    					[
    						[
    							197
    						]
    					],
    					[
    						[
    							198
    						]
    					],
    					[
    						[
    							-187,
    							199
    						]
    					]
    				],
    				type: "MultiPolygon",
    				properties: {
    					STATEFP: "23",
    					STATENS: "01779787",
    					AFFGEOID: "0400000US23",
    					GEOID: "23",
    					STUSPS: "ME",
    					NAME: "Maine",
    					LSAD: "00",
    					ALAND: 79887426037,
    					AWATER: 11746549764,
    					Admin_Per_100K: 44327,
    					Admin_Per_100k_18Plus: 54349,
    					Admin_Per_100k_65Plus: 118977,
    					Administered_18Plus: 595321,
    					Administered_65Plus: 339399,
    					Administered_Dose1_Pop_Pct: 29.7,
    					Administered_Dose1_Recip: 398960,
    					Administered_Dose1_Recip_18Plus: 398624,
    					Administered_Dose1_Recip_18PlusPop_Pct: 36.4,
    					Administered_Dose1_Recip_65Plus: 222994,
    					Administered_Dose1_Recip_65PlusPop_Pct: 78.2,
    					Administered_Dose2_Pop_Pct: 15,
    					Administered_Dose2_Recip: 202214,
    					Administered_Dose2_Recip_18Plus: 202017,
    					Administered_Dose2_Recip_18PlusPop_Pct: 18.4,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 17766,
    					Administered_Moderna: 293424,
    					Administered_Pfizer: 284617,
    					Administered_Unk_Manuf: 38,
    					Census2019: 1344212,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 50555,
    					Distributed_Janssen: 20900,
    					Distributed_Moderna: 345500,
    					Distributed_Per_100k_18Plus: 62040,
    					Distributed_Per_100k_65Plus: 238224,
    					Distributed_Pfizer: 313170,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 595845,
    					Doses_Distributed: 679570,
    					LongName: "Maine",
    					Series_Complete_18Plus: 219874,
    					Series_Complete_18PlusPop_Pct: 20.1,
    					Series_Complete_65Plus: 127880,
    					Series_Complete_65PlusPop_Pct: 44.8,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 17861,
    					Series_Complete_Janssen_18Plus: 17857,
    					Series_Complete_Janssen_65Plus: 9524,
    					Series_Complete_Moderna: 102070,
    					Series_Complete_Moderna_18Plus: 102049,
    					Series_Complete_Moderna_65Plus: 51968,
    					Series_Complete_Pfizer: 100136,
    					Series_Complete_Pfizer_18Plus: 99960,
    					Series_Complete_Pfizer_65Plus: 66384,
    					Series_Complete_Pop_Pct: 16.4,
    					Series_Complete_Unk_Manuf: 8,
    					Series_Complete_Unk_Manuf_18Plus: 8,
    					Series_Complete_Unk_Manuf_65Plus: 4,
    					Series_Complete_Yes: 220075,
    					ShortName: "MEA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						[
    							200
    						]
    					],
    					[
    						[
    							201
    						]
    					],
    					[
    						[
    							202
    						]
    					],
    					[
    						[
    							203
    						]
    					],
    					[
    						[
    							204
    						]
    					],
    					[
    						[
    							205
    						]
    					],
    					[
    						[
    							206
    						]
    					],
    					[
    						[
    							207
    						]
    					]
    				],
    				type: "MultiPolygon",
    				properties: {
    					STATEFP: "15",
    					STATENS: "01779782",
    					AFFGEOID: "0400000US15",
    					GEOID: "15",
    					STUSPS: "HI",
    					NAME: "Hawaii",
    					LSAD: "00",
    					ALAND: 16633990195,
    					AWATER: 11777809026,
    					Admin_Per_100K: 43380,
    					Admin_Per_100k_18Plus: 54922,
    					Admin_Per_100k_65Plus: 88930,
    					Administered_18Plus: 612934,
    					Administered_65Plus: 238730,
    					Administered_Dose1_Pop_Pct: 27.6,
    					Administered_Dose1_Recip: 390305,
    					Administered_Dose1_Recip_18Plus: 388658,
    					Administered_Dose1_Recip_18PlusPop_Pct: 34.8,
    					Administered_Dose1_Recip_65Plus: 152005,
    					Administered_Dose1_Recip_65PlusPop_Pct: 56.6,
    					Administered_Dose2_Pop_Pct: 16.1,
    					Administered_Dose2_Recip: 227323,
    					Administered_Dose2_Recip_18Plus: 227081,
    					Administered_Dose2_Recip_18PlusPop_Pct: 20.3,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 5024,
    					Administered_Moderna: 218096,
    					Administered_Pfizer: 297328,
    					Administered_Unk_Manuf: 93760,
    					Census2019: 1415872,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 54152,
    					Distributed_Janssen: 18300,
    					Distributed_Moderna: 332300,
    					Distributed_Per_100k_18Plus: 68703,
    					Distributed_Per_100k_65Plus: 285616,
    					Distributed_Pfizer: 416130,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 614208,
    					Doses_Distributed: 766730,
    					LongName: "Hawaii",
    					Series_Complete_18Plus: 232178,
    					Series_Complete_18PlusPop_Pct: 20.8,
    					Series_Complete_65Plus: 90023,
    					Series_Complete_65PlusPop_Pct: 33.5,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 5105,
    					Series_Complete_Janssen_18Plus: 5097,
    					Series_Complete_Janssen_65Plus: 1637,
    					Series_Complete_Moderna: 88521,
    					Series_Complete_Moderna_18Plus: 88477,
    					Series_Complete_Moderna_65Plus: 43261,
    					Series_Complete_Pfizer: 120783,
    					Series_Complete_Pfizer_18Plus: 120602,
    					Series_Complete_Pfizer_65Plus: 43718,
    					Series_Complete_Pop_Pct: 16.4,
    					Series_Complete_Unk_Manuf: 18019,
    					Series_Complete_Unk_Manuf_18Plus: 18002,
    					Series_Complete_Unk_Manuf_65Plus: 1407,
    					Series_Complete_Yes: 232428,
    					ShortName: "HIA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						-121,
    						208,
    						-193
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "10",
    					STATENS: "01779781",
    					AFFGEOID: "0400000US10",
    					GEOID: "10",
    					STUSPS: "DE",
    					NAME: "Delaware",
    					LSAD: "00",
    					ALAND: 5045925646,
    					AWATER: 1399985648,
    					Admin_Per_100K: 39964,
    					Admin_Per_100k_18Plus: 50477,
    					Admin_Per_100k_65Plus: 119139,
    					Administered_18Plus: 388770,
    					Administered_65Plus: 225061,
    					Administered_Dose1_Pop_Pct: 25.8,
    					Administered_Dose1_Recip: 251478,
    					Administered_Dose1_Recip_18Plus: 251176,
    					Administered_Dose1_Recip_18PlusPop_Pct: 32.6,
    					Administered_Dose1_Recip_65Plus: 141981,
    					Administered_Dose1_Recip_65PlusPop_Pct: 75.2,
    					Administered_Dose2_Pop_Pct: 13,
    					Administered_Dose2_Recip: 126366,
    					Administered_Dose2_Recip_18Plus: 126299,
    					Administered_Dose2_Recip_18PlusPop_Pct: 16.4,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 6753,
    					Administered_Moderna: 168996,
    					Administered_Pfizer: 213364,
    					Administered_Unk_Manuf: 44,
    					Census2019: 973764,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 49919,
    					Distributed_Janssen: 12300,
    					Distributed_Moderna: 227900,
    					Distributed_Per_100k_18Plus: 63113,
    					Distributed_Per_100k_65Plus: 257321,
    					Distributed_Pfizer: 245895,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 389157,
    					Doses_Distributed: 486095,
    					LongName: "Delaware",
    					Series_Complete_18Plus: 133331,
    					Series_Complete_18PlusPop_Pct: 17.3,
    					Series_Complete_65Plus: 82362,
    					Series_Complete_65PlusPop_Pct: 43.6,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 7032,
    					Series_Complete_Janssen_18Plus: 7032,
    					Series_Complete_Janssen_65Plus: 4733,
    					Series_Complete_Moderna: 61330,
    					Series_Complete_Moderna_18Plus: 61318,
    					Series_Complete_Moderna_65Plus: 39614,
    					Series_Complete_Pfizer: 65021,
    					Series_Complete_Pfizer_18Plus: 64966,
    					Series_Complete_Pfizer_65Plus: 38006,
    					Series_Complete_Pop_Pct: 13.7,
    					Series_Complete_Unk_Manuf: 15,
    					Series_Complete_Unk_Manuf_18Plus: 15,
    					Series_Complete_Unk_Manuf_65Plus: 9,
    					Series_Complete_Yes: 133398,
    					ShortName: "DEA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				type: null,
    				properties: {
    					STATEFP: "66",
    					STATENS: "01802705",
    					AFFGEOID: "0400000US66",
    					GEOID: "66",
    					STUSPS: "GU",
    					NAME: "Guam",
    					LSAD: "00",
    					ALAND: 543555840,
    					AWATER: 934337453,
    					Admin_Per_100K: 44624,
    					Admin_Per_100k_18Plus: 57171,
    					Admin_Per_100k_65Plus: 76850,
    					Administered_18Plus: 73922,
    					Administered_65Plus: 21657,
    					Administered_Dose1_Pop_Pct: 25.7,
    					Administered_Dose1_Recip: 42544,
    					Administered_Dose1_Recip_18Plus: 42513,
    					Administered_Dose1_Recip_18PlusPop_Pct: 32.9,
    					Administered_Dose1_Recip_65Plus: 11661,
    					Administered_Dose1_Recip_65PlusPop_Pct: 41.4,
    					Administered_Dose2_Pop_Pct: 18.5,
    					Administered_Dose2_Recip: 30700,
    					Administered_Dose2_Recip_18Plus: 30682,
    					Administered_Dose2_Recip_18PlusPop_Pct: 23.7,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 24,
    					Administered_Moderna: 36270,
    					Administered_Pfizer: 37679,
    					Administered_Unk_Manuf: 0,
    					Census2019: 165768,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 53002,
    					Distributed_Janssen: 1300,
    					Distributed_Moderna: 38200,
    					Distributed_Per_100k_18Plus: 67951,
    					Distributed_Per_100k_65Plus: 311770,
    					Distributed_Pfizer: 48360,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 73973,
    					Doses_Distributed: 87860,
    					LongName: "Guam",
    					Series_Complete_18Plus: 30706,
    					Series_Complete_18PlusPop_Pct: 23.7,
    					Series_Complete_65Plus: 9826,
    					Series_Complete_65PlusPop_Pct: 34.9,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 24,
    					Series_Complete_Janssen_18Plus: 24,
    					Series_Complete_Janssen_65Plus: 6,
    					Series_Complete_Moderna: 15292,
    					Series_Complete_Moderna_18Plus: 15290,
    					Series_Complete_Moderna_65Plus: 4314,
    					Series_Complete_Pfizer: 15408,
    					Series_Complete_Pfizer_18Plus: 15392,
    					Series_Complete_Pfizer_65Plus: 5506,
    					Series_Complete_Pop_Pct: 18.5,
    					Series_Complete_Unk_Manuf: 0,
    					Series_Complete_Unk_Manuf_18Plus: 0,
    					Series_Complete_Unk_Manuf_65Plus: 0,
    					Series_Complete_Yes: 30724,
    					ShortName: "GUA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				type: null,
    				properties: {
    					STATEFP: "69",
    					STATENS: "01779809",
    					AFFGEOID: "0400000US69",
    					GEOID: "69",
    					STUSPS: "MP",
    					NAME: "Commonwealth of the Northern Mariana Islands",
    					LSAD: "00",
    					ALAND: 472292529,
    					AWATER: 4644252461,
    					Admin_Per_100K: 43766,
    					Admin_Per_100k_18Plus: 56040,
    					Admin_Per_100k_65Plus: 43113,
    					Administered_18Plus: 24864,
    					Administered_65Plus: 4169,
    					Administered_Dose1_Pop_Pct: 25.5,
    					Administered_Dose1_Recip: 14511,
    					Administered_Dose1_Recip_18Plus: 14492,
    					Administered_Dose1_Recip_18PlusPop_Pct: 32.7,
    					Administered_Dose1_Recip_65Plus: 2203,
    					Administered_Dose1_Recip_65PlusPop_Pct: 22.8,
    					Administered_Dose2_Pop_Pct: 18.2,
    					Administered_Dose2_Recip: 10369,
    					Administered_Dose2_Recip_18Plus: 10357,
    					Administered_Dose2_Recip_18PlusPop_Pct: 23.3,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 14,
    					Administered_Moderna: 3282,
    					Administered_Pfizer: 21599,
    					Administered_Unk_Manuf: 0,
    					Census2019: 56882,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 77546,
    					Distributed_Janssen: 500,
    					Distributed_Moderna: 12800,
    					Distributed_Per_100k_18Plus: 99418,
    					Distributed_Per_100k_65Plus: 456153,
    					Distributed_Pfizer: 30810,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 24895,
    					Doses_Distributed: 44110,
    					LongName: "Northern Mariana Islands",
    					Series_Complete_18Plus: 10372,
    					Series_Complete_18PlusPop_Pct: 23.4,
    					Series_Complete_65Plus: 1977,
    					Series_Complete_65PlusPop_Pct: 20.4,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 15,
    					Series_Complete_Janssen_18Plus: 15,
    					Series_Complete_Janssen_65Plus: 13,
    					Series_Complete_Moderna: 1117,
    					Series_Complete_Moderna_18Plus: 1117,
    					Series_Complete_Moderna_65Plus: 282,
    					Series_Complete_Pfizer: 9252,
    					Series_Complete_Pfizer_18Plus: 9240,
    					Series_Complete_Pfizer_65Plus: 1682,
    					Series_Complete_Pop_Pct: 18.3,
    					Series_Complete_Unk_Manuf: 0,
    					Series_Complete_Unk_Manuf_18Plus: 0,
    					Series_Complete_Unk_Manuf_65Plus: 0,
    					Series_Complete_Yes: 10384,
    					ShortName: "MPA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						[
    							-54,
    							209
    						]
    					],
    					[
    						[
    							210,
    							-56,
    							211
    						]
    					]
    				],
    				type: "MultiPolygon",
    				properties: {
    					STATEFP: "44",
    					STATENS: "01219835",
    					AFFGEOID: "0400000US44",
    					GEOID: "44",
    					STUSPS: "RI",
    					NAME: "Rhode Island",
    					LSAD: "00",
    					ALAND: 2677779902,
    					AWATER: 1323670487,
    					Admin_Per_100K: 44291,
    					Admin_Per_100k_18Plus: 54822,
    					Admin_Per_100k_65Plus: 120968,
    					Administered_18Plus: 468656,
    					Administered_65Plus: 226265,
    					Administered_Dose1_Pop_Pct: 29.3,
    					Administered_Dose1_Recip: 310605,
    					Administered_Dose1_Recip_18Plus: 310203,
    					Administered_Dose1_Recip_18PlusPop_Pct: 36.3,
    					Administered_Dose1_Recip_65Plus: 151363,
    					Administered_Dose1_Recip_65PlusPop_Pct: 80.9,
    					Administered_Dose2_Pop_Pct: 14.9,
    					Administered_Dose2_Recip: 157976,
    					Administered_Dose2_Recip_18Plus: 157836,
    					Administered_Dose2_Recip_18PlusPop_Pct: 18.5,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 9656,
    					Administered_Moderna: 230340,
    					Administered_Pfizer: 229208,
    					Administered_Unk_Manuf: 1,
    					Census2019: 1059361,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 48472,
    					Distributed_Janssen: 14900,
    					Distributed_Moderna: 248800,
    					Distributed_Per_100k_18Plus: 60067,
    					Distributed_Per_100k_65Plus: 274529,
    					Distributed_Pfizer: 249795,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 469205,
    					Doses_Distributed: 513495,
    					LongName: "Rhode Island",
    					Series_Complete_18Plus: 167402,
    					Series_Complete_18PlusPop_Pct: 19.6,
    					Series_Complete_65Plus: 77523,
    					Series_Complete_65PlusPop_Pct: 41.4,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 9566,
    					Series_Complete_Janssen_18Plus: 9566,
    					Series_Complete_Janssen_65Plus: 1560,
    					Series_Complete_Moderna: 83903,
    					Series_Complete_Moderna_18Plus: 83899,
    					Series_Complete_Moderna_65Plus: 34159,
    					Series_Complete_Pfizer: 74072,
    					Series_Complete_Pfizer_18Plus: 73936,
    					Series_Complete_Pfizer_65Plus: 41804,
    					Series_Complete_Pop_Pct: 15.8,
    					Series_Complete_Unk_Manuf: 1,
    					Series_Complete_Unk_Manuf_18Plus: 1,
    					Series_Complete_Unk_Manuf_65Plus: 0,
    					Series_Complete_Yes: 167542,
    					ShortName: "RIA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						[
    							-178,
    							212,
    							213,
    							-32,
    							-28,
    							-139,
    							-126
    						]
    					],
    					[
    						[
    							-138,
    							-128
    						]
    					]
    				],
    				type: "MultiPolygon",
    				properties: {
    					STATEFP: "21",
    					STATENS: "01779786",
    					AFFGEOID: "0400000US21",
    					GEOID: "21",
    					STUSPS: "KY",
    					NAME: "Kentucky",
    					LSAD: "00",
    					ALAND: 102279490672,
    					AWATER: 2375337755,
    					Admin_Per_100K: 40236,
    					Admin_Per_100k_18Plus: 51774,
    					Admin_Per_100k_65Plus: 103220,
    					Administered_18Plus: 1793853,
    					Administered_65Plus: 774729,
    					Administered_Dose1_Pop_Pct: 27.3,
    					Administered_Dose1_Recip: 1220786,
    					Administered_Dose1_Recip_18Plus: 1218137,
    					Administered_Dose1_Recip_18PlusPop_Pct: 35.2,
    					Administered_Dose1_Recip_65Plus: 509934,
    					Administered_Dose1_Recip_65PlusPop_Pct: 67.9,
    					Administered_Dose2_Pop_Pct: 13.3,
    					Administered_Dose2_Recip: 594843,
    					Administered_Dose2_Recip_18Plus: 594405,
    					Administered_Dose2_Recip_18PlusPop_Pct: 17.2,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 37700,
    					Administered_Moderna: 873140,
    					Administered_Pfizer: 886667,
    					Administered_Unk_Manuf: 98,
    					Census2019: 4467673,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 46393,
    					Distributed_Janssen: 49700,
    					Distributed_Moderna: 1016200,
    					Distributed_Per_100k_18Plus: 59821,
    					Distributed_Per_100k_65Plus: 276150,
    					Distributed_Pfizer: 1006785,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 1797605,
    					Doses_Distributed: 2072685,
    					LongName: "Kentucky",
    					Series_Complete_18Plus: 629946,
    					Series_Complete_18PlusPop_Pct: 18.2,
    					Series_Complete_65Plus: 292733,
    					Series_Complete_65PlusPop_Pct: 39,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 35556,
    					Series_Complete_Janssen_18Plus: 35541,
    					Series_Complete_Janssen_65Plus: 11125,
    					Series_Complete_Moderna: 289970,
    					Series_Complete_Moderna_18Plus: 289952,
    					Series_Complete_Moderna_65Plus: 116858,
    					Series_Complete_Pfizer: 304797,
    					Series_Complete_Pfizer_18Plus: 304377,
    					Series_Complete_Pfizer_65Plus: 164700,
    					Series_Complete_Pop_Pct: 14.1,
    					Series_Complete_Unk_Manuf: 76,
    					Series_Complete_Unk_Manuf_18Plus: 76,
    					Series_Complete_Unk_Manuf_65Plus: 50,
    					Series_Complete_Yes: 630399,
    					ShortName: "KYA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						-44,
    						214,
    						-123,
    						-29,
    						-214,
    						215
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "39",
    					STATENS: "01085497",
    					AFFGEOID: "0400000US39",
    					GEOID: "39",
    					STUSPS: "OH",
    					NAME: "Ohio",
    					LSAD: "00",
    					ALAND: 105828882568,
    					AWATER: 10268850702,
    					Admin_Per_100K: 38044,
    					Admin_Per_100k_18Plus: 48760,
    					Admin_Per_100k_65Plus: 113905,
    					Administered_18Plus: 4442529,
    					Administered_65Plus: 2330859,
    					Administered_Dose1_Pop_Pct: 24.5,
    					Administered_Dose1_Recip: 2866528,
    					Administered_Dose1_Recip_18Plus: 2863408,
    					Administered_Dose1_Recip_18PlusPop_Pct: 31.4,
    					Administered_Dose1_Recip_65Plus: 1413073,
    					Administered_Dose1_Recip_65PlusPop_Pct: 69.1,
    					Administered_Dose2_Pop_Pct: 13.1,
    					Administered_Dose2_Recip: 1530678,
    					Administered_Dose2_Recip_18Plus: 1529324,
    					Administered_Dose2_Recip_18PlusPop_Pct: 16.8,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 121471,
    					Administered_Moderna: 2186613,
    					Administered_Pfizer: 2135293,
    					Administered_Unk_Manuf: 3643,
    					Census2019: 11689100,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 47401,
    					Distributed_Janssen: 151900,
    					Distributed_Moderna: 2654800,
    					Distributed_Per_100k_18Plus: 60814,
    					Distributed_Per_100k_65Plus: 270769,
    					Distributed_Pfizer: 2734095,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 4447020,
    					Doses_Distributed: 5540795,
    					LongName: "Ohio",
    					Series_Complete_18Plus: 1648834,
    					Series_Complete_18PlusPop_Pct: 18.1,
    					Series_Complete_65Plus: 930157,
    					Series_Complete_65PlusPop_Pct: 45.5,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 119525,
    					Series_Complete_Janssen_18Plus: 119510,
    					Series_Complete_Janssen_65Plus: 35756,
    					Series_Complete_Moderna: 775301,
    					Series_Complete_Moderna_18Plus: 775254,
    					Series_Complete_Moderna_65Plus: 409539,
    					Series_Complete_Pfizer: 754383,
    					Series_Complete_Pfizer_18Plus: 753079,
    					Series_Complete_Pfizer_65Plus: 484192,
    					Series_Complete_Pop_Pct: 14.1,
    					Series_Complete_Unk_Manuf: 994,
    					Series_Complete_Unk_Manuf_18Plus: 991,
    					Series_Complete_Unk_Manuf_65Plus: 670,
    					Series_Complete_Yes: 1650203,
    					ShortName: "OHA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						[
    							216
    						]
    					],
    					[
    						[
    							217
    						]
    					],
    					[
    						[
    							218
    						]
    					],
    					[
    						[
    							219,
    							-48,
    							220,
    							-175,
    							-184,
    							221
    						]
    					]
    				],
    				type: "MultiPolygon",
    				properties: {
    					STATEFP: "55",
    					STATENS: "01779806",
    					AFFGEOID: "0400000US55",
    					GEOID: "55",
    					STUSPS: "WI",
    					NAME: "Wisconsin",
    					LSAD: "00",
    					ALAND: 140290039723,
    					AWATER: 29344951758,
    					Admin_Per_100K: 42286,
    					Admin_Per_100k_18Plus: 53937,
    					Admin_Per_100k_65Plus: 131048,
    					Administered_18Plus: 2457300,
    					Administered_65Plus: 1333077,
    					Administered_Dose1_Pop_Pct: 27,
    					Administered_Dose1_Recip: 1570598,
    					Administered_Dose1_Recip_18Plus: 1566746,
    					Administered_Dose1_Recip_18PlusPop_Pct: 34.4,
    					Administered_Dose1_Recip_65Plus: 787557,
    					Administered_Dose1_Recip_65PlusPop_Pct: 77.4,
    					Administered_Dose2_Pop_Pct: 14.9,
    					Administered_Dose2_Recip: 867742,
    					Administered_Dose2_Recip_18Plus: 866921,
    					Administered_Dose2_Recip_18PlusPop_Pct: 19,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 41716,
    					Administered_Moderna: 1144854,
    					Administered_Pfizer: 1275310,
    					Administered_Unk_Manuf: 201,
    					Census2019: 5822434,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 44912,
    					Distributed_Janssen: 72300,
    					Distributed_Moderna: 1273800,
    					Distributed_Per_100k_18Plus: 57398,
    					Distributed_Per_100k_65Plus: 257064,
    					Distributed_Pfizer: 1268865,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 2462081,
    					Doses_Distributed: 2614965,
    					LongName: "Wisconsin",
    					Series_Complete_18Plus: 907482,
    					Series_Complete_18PlusPop_Pct: 19.9,
    					Series_Complete_65Plus: 527219,
    					Series_Complete_65PlusPop_Pct: 51.8,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 40590,
    					Series_Complete_Janssen_18Plus: 40561,
    					Series_Complete_Janssen_65Plus: 4550,
    					Series_Complete_Moderna: 399892,
    					Series_Complete_Moderna_18Plus: 399863,
    					Series_Complete_Moderna_65Plus: 258616,
    					Series_Complete_Pfizer: 467795,
    					Series_Complete_Pfizer_18Plus: 467003,
    					Series_Complete_Pfizer_65Plus: 264023,
    					Series_Complete_Pop_Pct: 15.6,
    					Series_Complete_Unk_Manuf: 55,
    					Series_Complete_Unk_Manuf_18Plus: 55,
    					Series_Complete_Unk_Manuf_65Plus: 30,
    					Series_Complete_Yes: 908332,
    					ShortName: "WIA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						-84,
    						-65,
    						-172,
    						-106,
    						222
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "41",
    					STATENS: "01155107",
    					AFFGEOID: "0400000US41",
    					GEOID: "41",
    					STUSPS: "OR",
    					NAME: "Oregon",
    					LSAD: "00",
    					ALAND: 248606993270,
    					AWATER: 6192386935,
    					Admin_Per_100K: 37566,
    					Admin_Per_100k_18Plus: 47143,
    					Admin_Per_100k_65Plus: 90733,
    					Administered_18Plus: 1579835,
    					Administered_65Plus: 695089,
    					Administered_Dose1_Pop_Pct: 24.2,
    					Administered_Dose1_Recip: 1019809,
    					Administered_Dose1_Recip_18Plus: 1016883,
    					Administered_Dose1_Recip_18PlusPop_Pct: 30.3,
    					Administered_Dose1_Recip_65Plus: 500744,
    					Administered_Dose1_Recip_65PlusPop_Pct: 65.4,
    					Administered_Dose2_Pop_Pct: 13.2,
    					Administered_Dose2_Recip: 557647,
    					Administered_Dose2_Recip_18Plus: 555996,
    					Administered_Dose2_Recip_18PlusPop_Pct: 16.6,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 32112,
    					Administered_Moderna: 773469,
    					Administered_Pfizer: 777810,
    					Administered_Unk_Manuf: 1058,
    					Census2019: 4217737,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 45870,
    					Distributed_Janssen: 55700,
    					Distributed_Moderna: 945500,
    					Distributed_Per_100k_18Plus: 57731,
    					Distributed_Per_100k_65Plus: 252541,
    					Distributed_Pfizer: 933465,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 1584449,
    					Doses_Distributed: 1934665,
    					LongName: "Oregon",
    					Series_Complete_18Plus: 587925,
    					Series_Complete_18PlusPop_Pct: 17.5,
    					Series_Complete_65Plus: 220900,
    					Series_Complete_65PlusPop_Pct: 28.8,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 31942,
    					Series_Complete_Janssen_18Plus: 31929,
    					Series_Complete_Janssen_65Plus: 20827,
    					Series_Complete_Moderna: 270369,
    					Series_Complete_Moderna_18Plus: 270204,
    					Series_Complete_Moderna_65Plus: 91344,
    					Series_Complete_Pfizer: 287104,
    					Series_Complete_Pfizer_18Plus: 285618,
    					Series_Complete_Pfizer_65Plus: 108646,
    					Series_Complete_Pop_Pct: 14,
    					Series_Complete_Unk_Manuf: 174,
    					Series_Complete_Unk_Manuf_18Plus: 174,
    					Series_Complete_Unk_Manuf_65Plus: 83,
    					Series_Complete_Yes: 589589,
    					ShortName: "ORA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						223,
    						224,
    						-92,
    						-182
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "38",
    					STATENS: "01779797",
    					AFFGEOID: "0400000US38",
    					GEOID: "38",
    					STUSPS: "ND",
    					NAME: "North Dakota",
    					LSAD: "00",
    					ALAND: 178707534813,
    					AWATER: 4403267548,
    					Admin_Per_100K: 47306,
    					Admin_Per_100k_18Plus: 61745,
    					Admin_Per_100k_65Plus: 134916,
    					Administered_18Plus: 359288,
    					Administered_65Plus: 161690,
    					Administered_Dose1_Pop_Pct: 29,
    					Administered_Dose1_Recip: 220711,
    					Administered_Dose1_Recip_18Plus: 219798,
    					Administered_Dose1_Recip_18PlusPop_Pct: 37.8,
    					Administered_Dose1_Recip_65Plus: 90085,
    					Administered_Dose1_Recip_65PlusPop_Pct: 75.2,
    					Administered_Dose2_Pop_Pct: 16.1,
    					Administered_Dose2_Recip: 123017,
    					Administered_Dose2_Recip_18Plus: 122783,
    					Administered_Dose2_Recip_18PlusPop_Pct: 21.1,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 7154,
    					Administered_Moderna: 172131,
    					Administered_Pfizer: 181216,
    					Administered_Unk_Manuf: 0,
    					Census2019: 762062,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 51257,
    					Distributed_Janssen: 10100,
    					Distributed_Moderna: 197600,
    					Distributed_Per_100k_18Plus: 67128,
    					Distributed_Per_100k_65Plus: 325929,
    					Distributed_Pfizer: 182910,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 360501,
    					Doses_Distributed: 390610,
    					LongName: "North Dakota",
    					Series_Complete_18Plus: 129240,
    					Series_Complete_18PlusPop_Pct: 22.2,
    					Series_Complete_65Plus: 66289,
    					Series_Complete_65PlusPop_Pct: 55.3,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 6463,
    					Series_Complete_Janssen_18Plus: 6457,
    					Series_Complete_Janssen_65Plus: 1189,
    					Series_Complete_Moderna: 59936,
    					Series_Complete_Moderna_18Plus: 59919,
    					Series_Complete_Moderna_65Plus: 32335,
    					Series_Complete_Pfizer: 63081,
    					Series_Complete_Pfizer_18Plus: 62864,
    					Series_Complete_Pfizer_65Plus: 32765,
    					Series_Complete_Pop_Pct: 17,
    					Series_Complete_Unk_Manuf: 0,
    					Series_Complete_Unk_Manuf_18Plus: 0,
    					Series_Complete_Unk_Manuf_65Plus: 0,
    					Series_Complete_Yes: 129480,
    					ShortName: "NDA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						-140,
    						-1,
    						-35,
    						-98,
    						-17,
    						-130
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "05",
    					STATENS: "00068085",
    					AFFGEOID: "0400000US05",
    					GEOID: "05",
    					STUSPS: "AR",
    					NAME: "Arkansas",
    					LSAD: "00",
    					ALAND: 134768872727,
    					AWATER: 2962859592,
    					Admin_Per_100K: 33421,
    					Admin_Per_100k_18Plus: 43453,
    					Admin_Per_100k_65Plus: 92469,
    					Administered_18Plus: 1007098,
    					Administered_65Plus: 484430,
    					Administered_Dose1_Pop_Pct: 22.5,
    					Administered_Dose1_Recip: 677806,
    					Administered_Dose1_Recip_18Plus: 676423,
    					Administered_Dose1_Recip_18PlusPop_Pct: 29.2,
    					Administered_Dose1_Recip_65Plus: 318692,
    					Administered_Dose1_Recip_65PlusPop_Pct: 60.8,
    					Administered_Dose2_Pop_Pct: 11,
    					Administered_Dose2_Recip: 330560,
    					Administered_Dose2_Recip_18Plus: 330418,
    					Administered_Dose2_Recip_18PlusPop_Pct: 14.3,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 18349,
    					Administered_Moderna: 502687,
    					Administered_Pfizer: 487333,
    					Administered_Unk_Manuf: 206,
    					Census2019: 3017804,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 48610,
    					Distributed_Janssen: 37500,
    					Distributed_Moderna: 745000,
    					Distributed_Per_100k_18Plus: 63295,
    					Distributed_Per_100k_65Plus: 280015,
    					Distributed_Pfizer: 684450,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 1008575,
    					Doses_Distributed: 1466950,
    					LongName: "Arkansas",
    					Series_Complete_18Plus: 348428,
    					Series_Complete_18PlusPop_Pct: 15,
    					Series_Complete_65Plus: 170905,
    					Series_Complete_65PlusPop_Pct: 32.6,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 18029,
    					Series_Complete_Janssen_18Plus: 18010,
    					Series_Complete_Janssen_65Plus: 3661,
    					Series_Complete_Moderna: 165047,
    					Series_Complete_Moderna_18Plus: 165027,
    					Series_Complete_Moderna_65Plus: 96766,
    					Series_Complete_Pfizer: 165470,
    					Series_Complete_Pfizer_18Plus: 165348,
    					Series_Complete_Pfizer_65Plus: 70443,
    					Series_Complete_Pop_Pct: 11.6,
    					Series_Complete_Unk_Manuf: 43,
    					Series_Complete_Unk_Manuf_18Plus: 43,
    					Series_Complete_Unk_Manuf_65Plus: 35,
    					Series_Complete_Yes: 348589,
    					ShortName: "ARA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						225,
    						-45,
    						-216,
    						-213,
    						-177
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "18",
    					STATENS: "00448508",
    					AFFGEOID: "0400000US18",
    					GEOID: "18",
    					STUSPS: "IN",
    					NAME: "Indiana",
    					LSAD: "00",
    					ALAND: 92789302676,
    					AWATER: 1538002829,
    					Admin_Per_100K: 36207,
    					Admin_Per_100k_18Plus: 47176,
    					Admin_Per_100k_65Plus: 127098,
    					Administered_18Plus: 2436267,
    					Administered_65Plus: 1379953,
    					Administered_Dose1_Pop_Pct: 22.1,
    					Administered_Dose1_Recip: 1489440,
    					Administered_Dose1_Recip_18Plus: 1488559,
    					Administered_Dose1_Recip_18PlusPop_Pct: 28.8,
    					Administered_Dose1_Recip_65Plus: 757266,
    					Administered_Dose1_Recip_65PlusPop_Pct: 69.7,
    					Administered_Dose2_Pop_Pct: 13.8,
    					Administered_Dose2_Recip: 929605,
    					Administered_Dose2_Recip_18Plus: 929222,
    					Administered_Dose2_Recip_18PlusPop_Pct: 18,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 39841,
    					Administered_Moderna: 1119265,
    					Administered_Pfizer: 1275094,
    					Administered_Unk_Manuf: 3319,
    					Census2019: 6732219,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 44031,
    					Distributed_Janssen: 85000,
    					Distributed_Moderna: 1461600,
    					Distributed_Per_100k_18Plus: 57399,
    					Distributed_Per_100k_65Plus: 273016,
    					Distributed_Pfizer: 1417650,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 2437519,
    					Doses_Distributed: 2964250,
    					LongName: "Indiana",
    					Series_Complete_18Plus: 969279,
    					Series_Complete_18PlusPop_Pct: 18.8,
    					Series_Complete_65Plus: 609459,
    					Series_Complete_65PlusPop_Pct: 56.1,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 40060,
    					Series_Complete_Janssen_18Plus: 40057,
    					Series_Complete_Janssen_65Plus: 5391,
    					Series_Complete_Moderna: 442277,
    					Series_Complete_Moderna_18Plus: 442243,
    					Series_Complete_Moderna_65Plus: 320123,
    					Series_Complete_Pfizer: 486160,
    					Series_Complete_Pfizer_18Plus: 485811,
    					Series_Complete_Pfizer_65Plus: 283082,
    					Series_Complete_Pop_Pct: 14.4,
    					Series_Complete_Unk_Manuf: 1168,
    					Series_Complete_Unk_Manuf_18Plus: 1168,
    					Series_Complete_Unk_Manuf_65Plus: 863,
    					Series_Complete_Yes: 969665,
    					ShortName: "INA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						226,
    						-222,
    						-183,
    						-93,
    						-225
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "27",
    					STATENS: "00662849",
    					AFFGEOID: "0400000US27",
    					GEOID: "27",
    					STUSPS: "MN",
    					NAME: "Minnesota",
    					LSAD: "00",
    					ALAND: 206228939448,
    					AWATER: 18945217189,
    					Admin_Per_100K: 41508,
    					Admin_Per_100k_18Plus: 53892,
    					Admin_Per_100k_65Plus: 123338,
    					Administered_18Plus: 2337016,
    					Administered_65Plus: 1135183,
    					Administered_Dose1_Pop_Pct: 27.2,
    					Administered_Dose1_Recip: 1534133,
    					Administered_Dose1_Recip_18Plus: 1531012,
    					Administered_Dose1_Recip_18PlusPop_Pct: 35.3,
    					Administered_Dose1_Recip_65Plus: 731455,
    					Administered_Dose1_Recip_65PlusPop_Pct: 79.5,
    					Administered_Dose2_Pop_Pct: 14.5,
    					Administered_Dose2_Recip: 817562,
    					Administered_Dose2_Recip_18Plus: 816761,
    					Administered_Dose2_Recip_18PlusPop_Pct: 18.8,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 51627,
    					Administered_Moderna: 1091660,
    					Administered_Pfizer: 1197421,
    					Administered_Unk_Manuf: 192,
    					Census2019: 5639632,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 45247,
    					Distributed_Janssen: 65100,
    					Distributed_Moderna: 1236300,
    					Distributed_Per_100k_18Plus: 58844,
    					Distributed_Per_100k_65Plus: 277248,
    					Distributed_Pfizer: 1250340,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 2340900,
    					Doses_Distributed: 2551740,
    					LongName: "Minnesota",
    					Series_Complete_18Plus: 868648,
    					Series_Complete_18PlusPop_Pct: 20,
    					Series_Complete_65Plus: 448072,
    					Series_Complete_65PlusPop_Pct: 48.7,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 51903,
    					Series_Complete_Janssen_18Plus: 51887,
    					Series_Complete_Janssen_65Plus: 28906,
    					Series_Complete_Moderna: 368975,
    					Series_Complete_Moderna_18Plus: 368940,
    					Series_Complete_Moderna_65Plus: 181764,
    					Series_Complete_Pfizer: 448542,
    					Series_Complete_Pfizer_18Plus: 447776,
    					Series_Complete_Pfizer_65Plus: 237384,
    					Series_Complete_Pop_Pct: 15.4,
    					Series_Complete_Unk_Manuf: 45,
    					Series_Complete_Unk_Manuf_18Plus: 45,
    					Series_Complete_Unk_Manuf_65Plus: 18,
    					Series_Complete_Yes: 869465,
    					ShortName: "MNA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			},
    			{
    				arcs: [
    					[
    						-57,
    						-211,
    						227,
    						-145
    					]
    				],
    				type: "Polygon",
    				properties: {
    					STATEFP: "09",
    					STATENS: "01779780",
    					AFFGEOID: "0400000US09",
    					GEOID: "09",
    					STUSPS: "CT",
    					NAME: "Connecticut",
    					LSAD: "00",
    					ALAND: 12542497068,
    					AWATER: 1815617571,
    					Admin_Per_100K: 46513,
    					Admin_Per_100k_18Plus: 58354,
    					Admin_Per_100k_65Plus: 136229,
    					Administered_18Plus: 1655994,
    					Administered_65Plus: 858577,
    					Administered_Dose1_Pop_Pct: 30.3,
    					Administered_Dose1_Recip: 1079370,
    					Administered_Dose1_Recip_18Plus: 1077838,
    					Administered_Dose1_Recip_18PlusPop_Pct: 38,
    					Administered_Dose1_Recip_65Plus: 507419,
    					Administered_Dose1_Recip_65PlusPop_Pct: 80.5,
    					Administered_Dose2_Pop_Pct: 15.8,
    					Administered_Dose2_Recip: 564971,
    					Administered_Dose2_Recip_18Plus: 564299,
    					Administered_Dose2_Recip_18PlusPop_Pct: 19.9,
    					Administered_Fed_LTC: null,
    					Administered_Fed_LTC_Dose1: null,
    					Administered_Fed_LTC_Dose2: null,
    					Administered_Janssen: 38727,
    					Administered_Moderna: 743722,
    					Administered_Pfizer: 875763,
    					Administered_Unk_Manuf: 126,
    					Census2019: 3565287,
    					"Date": "2021-03-22",
    					Dist_Per_100K: 53275,
    					Distributed_Janssen: 48400,
    					Distributed_Moderna: 860200,
    					Distributed_Per_100k_18Plus: 66931,
    					Distributed_Per_100k_65Plus: 301375,
    					Distributed_Pfizer: 990795,
    					Distributed_Unk_Manuf: 0,
    					Doses_Administered: 1658338,
    					Doses_Distributed: 1899395,
    					LongName: "Connecticut",
    					Series_Complete_18Plus: 602923,
    					Series_Complete_18PlusPop_Pct: 21.2,
    					Series_Complete_65Plus: 344381,
    					Series_Complete_65PlusPop_Pct: 54.6,
    					Series_Complete_FedLTC: null,
    					Series_Complete_Janssen: 38653,
    					Series_Complete_Janssen_18Plus: 38624,
    					Series_Complete_Janssen_65Plus: 4440,
    					Series_Complete_Moderna: 247652,
    					Series_Complete_Moderna_18Plus: 247495,
    					Series_Complete_Moderna_65Plus: 122794,
    					Series_Complete_Pfizer: 317302,
    					Series_Complete_Pfizer_18Plus: 316787,
    					Series_Complete_Pfizer_65Plus: 217137,
    					Series_Complete_Pop_Pct: 16.9,
    					Series_Complete_Unk_Manuf: 17,
    					Series_Complete_Unk_Manuf_18Plus: 17,
    					Series_Complete_Unk_Manuf_65Plus: 10,
    					Series_Complete_Yes: 603624,
    					ShortName: "CTA",
    					date_type: "Report",
    					fill: "rgb(237, 229, 241)"
    				}
    			}
    		]
    	},
    	names: {
    		type: "GeometryCollection",
    		geometries: [
    			{
    				type: "Point",
    				coordinates: [
    					19488,
    					5783
    				],
    				properties: {
    					STATEFP: "28",
    					STATENS: "01779790",
    					AFFGEOID: "0400000US28",
    					GEOID: "28",
    					STUSPS: "MS",
    					NAME: "Mississippi",
    					LSAD: "00",
    					ALAND: 121533519481,
    					AWATER: 3926919758,
    					full_name: "Mississippi",
    					nyt_name: "Miss.",
    					"label-text": "Miss.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-MS",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-MS"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					26038,
    					8789
    				],
    				properties: {
    					STATEFP: "37",
    					STATENS: "01027616",
    					AFFGEOID: "0400000US37",
    					GEOID: "37",
    					STUSPS: "NC",
    					NAME: "North Carolina",
    					LSAD: "00",
    					ALAND: 125923656064,
    					AWATER: 13466071395,
    					full_name: "North Carolina",
    					nyt_name: "N.C.",
    					"label-text": "N.C.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-NC",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-NC"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					15021,
    					7795
    				],
    				properties: {
    					STATEFP: "40",
    					STATENS: "01102857",
    					AFFGEOID: "0400000US40",
    					GEOID: "40",
    					STUSPS: "OK",
    					NAME: "Oklahoma",
    					LSAD: "00",
    					ALAND: 177662925723,
    					AWATER: 3374587997,
    					full_name: "Oklahoma",
    					nyt_name: "Okla.",
    					"label-text": "Okla.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-OK",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-OK"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					25475,
    					10366
    				],
    				properties: {
    					STATEFP: "51",
    					STATENS: "01779803",
    					AFFGEOID: "0400000US51",
    					GEOID: "51",
    					STUSPS: "VA",
    					NAME: "Virginia",
    					LSAD: "00",
    					ALAND: 102257717110,
    					AWATER: 8528531774,
    					full_name: "Virginia",
    					nyt_name: "Va.",
    					"label-text": "Va.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-VA",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-VA"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					24256,
    					11055
    				],
    				properties: {
    					STATEFP: "54",
    					STATENS: "01779805",
    					AFFGEOID: "0400000US54",
    					GEOID: "54",
    					STUSPS: "WV",
    					NAME: "West Virginia",
    					LSAD: "00",
    					ALAND: 62266474513,
    					AWATER: 489028543,
    					full_name: "West Virginia",
    					nyt_name: "W.V.",
    					"label-text": "W.V.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-WV",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-WV"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					17700,
    					5033
    				],
    				properties: {
    					STATEFP: "22",
    					STATENS: "01629543",
    					AFFGEOID: "0400000US22",
    					GEOID: "22",
    					STUSPS: "LA",
    					NAME: "Louisiana",
    					LSAD: "00",
    					ALAND: 111897594374,
    					AWATER: 23753621895,
    					full_name: "Louisiana",
    					nyt_name: "La.",
    					"label-text": "La.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-LA",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-LA"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					21580,
    					14075
    				],
    				properties: {
    					STATEFP: "26",
    					STATENS: "01779789",
    					AFFGEOID: "0400000US26",
    					GEOID: "26",
    					STUSPS: "MI",
    					NAME: "Michigan",
    					LSAD: "00",
    					ALAND: 146600952990,
    					AWATER: 103885855702,
    					full_name: "Michigan",
    					nyt_name: "Mich.",
    					"label-text": "Mich.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-MI",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-MI"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					28567,
    					15010
    				],
    				properties: {
    					STATEFP: "25",
    					STATENS: "00606926",
    					AFFGEOID: "0400000US25",
    					GEOID: "25",
    					STUSPS: "MA",
    					NAME: "Massachusetts",
    					LSAD: "00",
    					ALAND: 20205125364,
    					AWATER: 7129925486,
    					full_name: "Massachusetts",
    					nyt_name: "Mass.",
    					"label-text": "Mass.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-MA",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-MA"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					5692,
    					15266
    				],
    				properties: {
    					STATEFP: "16",
    					STATENS: "01779783",
    					AFFGEOID: "0400000US16",
    					GEOID: "16",
    					STUSPS: "ID",
    					NAME: "Idaho",
    					LSAD: "00",
    					ALAND: 214049787659,
    					AWATER: 2391722557,
    					full_name: "Idaho",
    					nyt_name: "Idaho",
    					"label-text": "Idaho",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-ID",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-ID"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					24841,
    					3140
    				],
    				properties: {
    					STATEFP: "12",
    					STATENS: "00294478",
    					AFFGEOID: "0400000US12",
    					GEOID: "12",
    					STUSPS: "FL",
    					NAME: "Florida",
    					LSAD: "00",
    					ALAND: 138949136250,
    					AWATER: 31361101223,
    					full_name: "Florida",
    					nyt_name: "Fla.",
    					"label-text": "Fla.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-FL",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-FL"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					13522,
    					12606
    				],
    				properties: {
    					STATEFP: "31",
    					STATENS: "01779792",
    					AFFGEOID: "0400000US31",
    					GEOID: "31",
    					STUSPS: "NE",
    					NAME: "Nebraska",
    					LSAD: "00",
    					ALAND: 198956658395,
    					AWATER: 1371829134,
    					full_name: "Nebraska",
    					nyt_name: "Neb.",
    					"label-text": "Neb.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-NE",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-NE"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					3635,
    					18871
    				],
    				properties: {
    					STATEFP: "53",
    					STATENS: "01779804",
    					AFFGEOID: "0400000US53",
    					GEOID: "53",
    					STUSPS: "WA",
    					NAME: "Washington",
    					LSAD: "00",
    					ALAND: 172112588220,
    					AWATER: 12559278850,
    					full_name: "Washington",
    					nyt_name: "Wash.",
    					"label-text": "Wash.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-WA",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-WA"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					9546,
    					7367
    				],
    				properties: {
    					STATEFP: "35",
    					STATENS: "00897535",
    					AFFGEOID: "0400000US35",
    					GEOID: "35",
    					STUSPS: "NM",
    					NAME: "New Mexico",
    					LSAD: "00",
    					ALAND: 314196306401,
    					AWATER: 728776523,
    					full_name: "New Mexico",
    					nyt_name: "N.M.",
    					"label-text": "N.M.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-NM",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-NM"
    			},
    			{
    				type: null,
    				properties: {
    					STATEFP: "72",
    					STATENS: "01779808",
    					AFFGEOID: "0400000US72",
    					GEOID: "72",
    					STUSPS: "PR",
    					NAME: "Puerto Rico",
    					LSAD: "00",
    					ALAND: 8868896030,
    					AWATER: 4922382562,
    					full_name: "Puerto Rico",
    					nyt_name: "P.R.",
    					"label-text": "P.R.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-PR",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-PR"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					13381,
    					14958
    				],
    				properties: {
    					STATEFP: "46",
    					STATENS: "01785534",
    					AFFGEOID: "0400000US46",
    					GEOID: "46",
    					STUSPS: "SD",
    					NAME: "South Dakota",
    					LSAD: "00",
    					ALAND: 196346981786,
    					AWATER: 3382720225,
    					full_name: "South Dakota",
    					nyt_name: "S.D.",
    					"label-text": "S.D.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-SD",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-SD"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					13922,
    					4460
    				],
    				properties: {
    					STATEFP: "48",
    					STATENS: "01779801",
    					AFFGEOID: "0400000US48",
    					GEOID: "48",
    					STUSPS: "TX",
    					NAME: "Texas",
    					LSAD: "00",
    					ALAND: 676653171537,
    					AWATER: 19006305260,
    					full_name: "Texas",
    					nyt_name: "Tex.",
    					"label-text": "Tex.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-TX",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-TX"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					1877,
    					10537
    				],
    				properties: {
    					STATEFP: "06",
    					STATENS: "01779778",
    					AFFGEOID: "0400000US06",
    					GEOID: "06",
    					STUSPS: "CA",
    					NAME: "California",
    					LSAD: "00",
    					ALAND: 403503931312,
    					AWATER: 20463871877,
    					full_name: "California",
    					nyt_name: "Calif.",
    					"label-text": "Calif.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-CA",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-CA"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					21268,
    					5967
    				],
    				properties: {
    					STATEFP: "01",
    					STATENS: "01779775",
    					AFFGEOID: "0400000US01",
    					GEOID: "01",
    					STUSPS: "AL",
    					NAME: "Alabama",
    					LSAD: "00",
    					ALAND: 131174048583,
    					AWATER: 4593327154,
    					full_name: "Alabama",
    					nyt_name: "Ala.",
    					"label-text": "Ala.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-AL",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-AL"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					23473,
    					5966
    				],
    				properties: {
    					STATEFP: "13",
    					STATENS: "01705317",
    					AFFGEOID: "0400000US13",
    					GEOID: "13",
    					STUSPS: "GA",
    					NAME: "Georgia",
    					LSAD: "00",
    					ALAND: 149482048342,
    					AWATER: 4422936154,
    					full_name: "Georgia",
    					nyt_name: "Ga.",
    					"label-text": "Ga.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-GA",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-GA"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					25618,
    					13082
    				],
    				properties: {
    					STATEFP: "42",
    					STATENS: "01779798",
    					AFFGEOID: "0400000US42",
    					GEOID: "42",
    					STUSPS: "PA",
    					NAME: "Pennsylvania",
    					LSAD: "00",
    					ALAND: 115884442321,
    					AWATER: 3394589990,
    					full_name: "Pennsylvania",
    					nyt_name: "Pa.",
    					"label-text": "Pa.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-PA",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-PA"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					17597,
    					10027
    				],
    				properties: {
    					STATEFP: "29",
    					STATENS: "01779791",
    					AFFGEOID: "0400000US29",
    					GEOID: "29",
    					STUSPS: "MO",
    					NAME: "Missouri",
    					LSAD: "00",
    					ALAND: 178050802184,
    					AWATER: 2489425460,
    					full_name: "Missouri",
    					nyt_name: "Mo.",
    					"label-text": "Mo.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-MO",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-MO"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					10187,
    					10871
    				],
    				properties: {
    					STATEFP: "08",
    					STATENS: "01779779",
    					AFFGEOID: "0400000US08",
    					GEOID: "08",
    					STUSPS: "CO",
    					NAME: "Colorado",
    					LSAD: "00",
    					ALAND: 268422891711,
    					AWATER: 1181621593,
    					full_name: "Colorado",
    					nyt_name: "Colo.",
    					"label-text": "Colo.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-CO",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-CO"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					6808,
    					11454
    				],
    				properties: {
    					STATEFP: "49",
    					STATENS: "01455989",
    					AFFGEOID: "0400000US49",
    					GEOID: "49",
    					STUSPS: "UT",
    					NAME: "Utah",
    					LSAD: "00",
    					ALAND: 212886221680,
    					AWATER: 6998824394,
    					full_name: "Utah",
    					nyt_name: "Utah",
    					"label-text": "Utah",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-UT",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-UT"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					21313,
    					8374
    				],
    				properties: {
    					STATEFP: "47",
    					STATENS: "01325873",
    					AFFGEOID: "0400000US47",
    					GEOID: "47",
    					STUSPS: "TN",
    					NAME: "Tennessee",
    					LSAD: "00",
    					ALAND: 106802728188,
    					AWATER: 2350123465,
    					full_name: "Tennessee",
    					nyt_name: "Tenn.",
    					"label-text": "Tenn.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-TN",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-TN"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					9415,
    					14149
    				],
    				properties: {
    					STATEFP: "56",
    					STATENS: "01779807",
    					AFFGEOID: "0400000US56",
    					GEOID: "56",
    					STUSPS: "WY",
    					NAME: "Wyoming",
    					LSAD: "00",
    					ALAND: 251458544898,
    					AWATER: 1867670745,
    					full_name: "Wyoming",
    					nyt_name: "Wy.",
    					"label-text": "Wy.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-WY",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-WY"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					26867,
    					15117
    				],
    				properties: {
    					STATEFP: "36",
    					STATENS: "01779796",
    					AFFGEOID: "0400000US36",
    					GEOID: "36",
    					STUSPS: "NY",
    					NAME: "New York",
    					LSAD: "00",
    					ALAND: 122049149763,
    					AWATER: 19246994695,
    					full_name: "New York",
    					nyt_name: "N.Y.",
    					"label-text": "N.Y.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-NY",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-NY"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					14242,
    					10206
    				],
    				properties: {
    					STATEFP: "20",
    					STATENS: "00481813",
    					AFFGEOID: "0400000US20",
    					GEOID: "20",
    					STUSPS: "KS",
    					NAME: "Kansas",
    					LSAD: "00",
    					ALAND: 211755344060,
    					AWATER: 1344141205,
    					full_name: "Kansas",
    					nyt_name: "Kan.",
    					"label-text": "Kan.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-KS",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-KS"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					3271,
    					3264
    				],
    				properties: {
    					STATEFP: "02",
    					STATENS: "01785533",
    					AFFGEOID: "0400000US02",
    					GEOID: "02",
    					STUSPS: "AK",
    					NAME: "Alaska",
    					LSAD: "00",
    					ALAND: 1478839695958,
    					AWATER: 245481577452,
    					full_name: "Alaska",
    					nyt_name: "Alaska",
    					"label-text": "Alaska",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-AK",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-AK"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					3996,
    					12330
    				],
    				properties: {
    					STATEFP: "32",
    					STATENS: "01779793",
    					AFFGEOID: "0400000US32",
    					GEOID: "32",
    					STUSPS: "NV",
    					NAME: "Nevada",
    					LSAD: "00",
    					ALAND: 284329506470,
    					AWATER: 2047206072,
    					full_name: "Nevada",
    					nyt_name: "Nev.",
    					"label-text": "Nev.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-NV",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-NV"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					19318,
    					11665
    				],
    				properties: {
    					STATEFP: "17",
    					STATENS: "01779784",
    					AFFGEOID: "0400000US17",
    					GEOID: "17",
    					STUSPS: "IL",
    					NAME: "Illinois",
    					LSAD: "00",
    					ALAND: 143780567633,
    					AWATER: 6214824948,
    					full_name: "Illinois",
    					nyt_name: "Ill.",
    					"label-text": "Ill.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-IL",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-IL"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					27777,
    					16181
    				],
    				properties: {
    					STATEFP: "50",
    					STATENS: "01779802",
    					AFFGEOID: "0400000US50",
    					GEOID: "50",
    					STUSPS: "VT",
    					NAME: "Vermont",
    					LSAD: "00",
    					ALAND: 23874175944,
    					AWATER: 1030416650,
    					full_name: "Vermont",
    					nyt_name: "Vt.",
    					"label-text": "Vt.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-VT",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-VT"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					8732,
    					17413
    				],
    				properties: {
    					STATEFP: "30",
    					STATENS: "00767982",
    					AFFGEOID: "0400000US30",
    					GEOID: "30",
    					STUSPS: "MT",
    					NAME: "Montana",
    					LSAD: "00",
    					ALAND: 376962738765,
    					AWATER: 3869208832,
    					full_name: "Montana",
    					nyt_name: "Mont.",
    					"label-text": "Mont.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-MT",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-MT"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					16967,
    					13007
    				],
    				properties: {
    					STATEFP: "19",
    					STATENS: "01779785",
    					AFFGEOID: "0400000US19",
    					GEOID: "19",
    					STUSPS: "IA",
    					NAME: "Iowa",
    					LSAD: "00",
    					ALAND: 144661267977,
    					AWATER: 1084180812,
    					full_name: "Iowa",
    					nyt_name: "Iowa",
    					"label-text": "Iowa",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-IA",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-IA"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					24854,
    					7278
    				],
    				properties: {
    					STATEFP: "45",
    					STATENS: "01779799",
    					AFFGEOID: "0400000US45",
    					GEOID: "45",
    					STUSPS: "SC",
    					NAME: "South Carolina",
    					LSAD: "00",
    					ALAND: 77864918488,
    					AWATER: 5075218778,
    					full_name: "South Carolina",
    					nyt_name: "S.C.",
    					"label-text": "S.C.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-SC",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-SC"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					28447,
    					15944
    				],
    				properties: {
    					STATEFP: "33",
    					STATENS: "01779794",
    					AFFGEOID: "0400000US33",
    					GEOID: "33",
    					STUSPS: "NH",
    					NAME: "New Hampshire",
    					LSAD: "00",
    					ALAND: 23189413166,
    					AWATER: 1026675248,
    					full_name: "New Hampshire",
    					nyt_name: "N.H.",
    					"label-text": "N.H.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-NH",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-NH"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					6209,
    					7709
    				],
    				properties: {
    					STATEFP: "04",
    					STATENS: "01779777",
    					AFFGEOID: "0400000US04",
    					GEOID: "04",
    					STUSPS: "AZ",
    					NAME: "Arizona",
    					LSAD: "00",
    					ALAND: 294198551143,
    					AWATER: 1027337603,
    					full_name: "Arizona",
    					nyt_name: "Ariz.",
    					"label-text": "Ariz.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-AZ",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-AZ"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					26339,
    					11657
    				],
    				properties: {
    					STATEFP: "11",
    					STATENS: "01702382",
    					AFFGEOID: "0400000US11",
    					GEOID: "11",
    					STUSPS: "DC",
    					NAME: "District of Columbia",
    					LSAD: "00",
    					ALAND: 158340391,
    					AWATER: 18687198,
    					full_name: "District of Columbia",
    					nyt_name: "D.C.",
    					"label-text": "D.C.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-DC",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-DC"
    			},
    			{
    				type: null,
    				properties: {
    					STATEFP: "60",
    					STATENS: "01802701",
    					AFFGEOID: "0400000US60",
    					GEOID: "60",
    					STUSPS: "AS",
    					NAME: "American Samoa",
    					LSAD: "00",
    					ALAND: 197759063,
    					AWATER: 1307243754,
    					full_name: null,
    					nyt_name: null,
    					"label-text": null,
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-AS",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-AS"
    			},
    			{
    				type: null,
    				properties: {
    					STATEFP: "78",
    					STATENS: "01802710",
    					AFFGEOID: "0400000US78",
    					GEOID: "78",
    					STUSPS: "VI",
    					NAME: "United States Virgin Islands",
    					LSAD: "00",
    					ALAND: 348021896,
    					AWATER: 1550236201,
    					full_name: null,
    					nyt_name: null,
    					"label-text": null,
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-VI",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-VI"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					27400,
    					12451
    				],
    				properties: {
    					STATEFP: "34",
    					STATENS: "01779795",
    					AFFGEOID: "0400000US34",
    					GEOID: "34",
    					STUSPS: "NJ",
    					NAME: "New Jersey",
    					LSAD: "00",
    					ALAND: 19047825980,
    					AWATER: 3544860246,
    					full_name: "New Jersey",
    					nyt_name: "N.J.",
    					"label-text": "N.J.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-NJ",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-NJ"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					26322,
    					12011
    				],
    				properties: {
    					STATEFP: "24",
    					STATENS: "01714934",
    					AFFGEOID: "0400000US24",
    					GEOID: "24",
    					STUSPS: "MD",
    					NAME: "Maryland",
    					LSAD: "00",
    					ALAND: 25151100280,
    					AWATER: 6979966958,
    					full_name: "Maryland",
    					nyt_name: "Md.",
    					"label-text": "Md.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-MD",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-MD"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					29315,
    					17654
    				],
    				properties: {
    					STATEFP: "23",
    					STATENS: "01779787",
    					AFFGEOID: "0400000US23",
    					GEOID: "23",
    					STUSPS: "ME",
    					NAME: "Maine",
    					LSAD: "00",
    					ALAND: 79887426037,
    					AWATER: 11746549764,
    					full_name: "Maine",
    					nyt_name: "Maine",
    					"label-text": "Maine",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-ME",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-ME"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					9667,
    					875
    				],
    				properties: {
    					STATEFP: "15",
    					STATENS: "01779782",
    					AFFGEOID: "0400000US15",
    					GEOID: "15",
    					STUSPS: "HI",
    					NAME: "Hawaii",
    					LSAD: "00",
    					ALAND: 16633990195,
    					AWATER: 11777809026,
    					full_name: "Hawaii",
    					nyt_name: "Hawaii",
    					"label-text": "Hawaii",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-HI",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-HI"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					27247,
    					11696
    				],
    				properties: {
    					STATEFP: "10",
    					STATENS: "01779781",
    					AFFGEOID: "0400000US10",
    					GEOID: "10",
    					STUSPS: "DE",
    					NAME: "Delaware",
    					LSAD: "00",
    					ALAND: 5045925646,
    					AWATER: 1399985648,
    					full_name: "Delaware",
    					nyt_name: "Del.",
    					"label-text": "Del.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-DE",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-DE"
    			},
    			{
    				type: null,
    				properties: {
    					STATEFP: "66",
    					STATENS: "01802705",
    					AFFGEOID: "0400000US66",
    					GEOID: "66",
    					STUSPS: "GU",
    					NAME: "Guam",
    					LSAD: "00",
    					ALAND: 543555840,
    					AWATER: 934337453,
    					full_name: null,
    					nyt_name: null,
    					"label-text": null,
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-GU",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-GU"
    			},
    			{
    				type: null,
    				properties: {
    					STATEFP: "69",
    					STATENS: "01779809",
    					AFFGEOID: "0400000US69",
    					GEOID: "69",
    					STUSPS: "MP",
    					NAME: "Commonwealth of the Northern Mariana Islands",
    					LSAD: "00",
    					ALAND: 472292529,
    					AWATER: 4644252461,
    					full_name: null,
    					nyt_name: null,
    					"label-text": null,
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-MP",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-MP"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					28814,
    					14606
    				],
    				properties: {
    					STATEFP: "44",
    					STATENS: "01219835",
    					AFFGEOID: "0400000US44",
    					GEOID: "44",
    					STUSPS: "RI",
    					NAME: "Rhode Island",
    					LSAD: "00",
    					ALAND: 2677779902,
    					AWATER: 1323670487,
    					full_name: "Rhode Island",
    					nyt_name: "R.I.",
    					"label-text": "R.I.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-RI",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-RI"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					22290,
    					10012
    				],
    				properties: {
    					STATEFP: "21",
    					STATENS: "01779786",
    					AFFGEOID: "0400000US21",
    					GEOID: "21",
    					STUSPS: "KY",
    					NAME: "Kentucky",
    					LSAD: "00",
    					ALAND: 102279490672,
    					AWATER: 2375337755,
    					full_name: "Kentucky",
    					nyt_name: "Ky.",
    					"label-text": "Ky.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-KY",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-KY"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					22929,
    					12013
    				],
    				properties: {
    					STATEFP: "39",
    					STATENS: "01085497",
    					AFFGEOID: "0400000US39",
    					GEOID: "39",
    					STUSPS: "OH",
    					NAME: "Ohio",
    					LSAD: "00",
    					ALAND: 105828882568,
    					AWATER: 10268850702,
    					full_name: "Ohio",
    					nyt_name: "Ohio",
    					"label-text": "Ohio",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-OH",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-OH"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					18774,
    					15328
    				],
    				properties: {
    					STATEFP: "55",
    					STATENS: "01779806",
    					AFFGEOID: "0400000US55",
    					GEOID: "55",
    					STUSPS: "WI",
    					NAME: "Wisconsin",
    					LSAD: "00",
    					ALAND: 140290039723,
    					AWATER: 29344951758,
    					full_name: "Wisconsin",
    					nyt_name: "Wis.",
    					"label-text": "Wis.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-WI",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-WI"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					2736,
    					16185
    				],
    				properties: {
    					STATEFP: "41",
    					STATENS: "01155107",
    					AFFGEOID: "0400000US41",
    					GEOID: "41",
    					STUSPS: "OR",
    					NAME: "Oregon",
    					LSAD: "00",
    					ALAND: 248606993270,
    					AWATER: 6192386935,
    					full_name: "Oregon",
    					nyt_name: "Ore.",
    					"label-text": "Ore.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-OR",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-OR"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					13360,
    					17313
    				],
    				properties: {
    					STATEFP: "38",
    					STATENS: "01779797",
    					AFFGEOID: "0400000US38",
    					GEOID: "38",
    					STUSPS: "ND",
    					NAME: "North Dakota",
    					LSAD: "00",
    					ALAND: 178707534813,
    					AWATER: 4403267548,
    					full_name: "North Dakota",
    					nyt_name: "N.D.",
    					"label-text": "N.D.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-ND",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-ND"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					17712,
    					7446
    				],
    				properties: {
    					STATEFP: "05",
    					STATENS: "00068085",
    					AFFGEOID: "0400000US05",
    					GEOID: "05",
    					STUSPS: "AR",
    					NAME: "Arkansas",
    					LSAD: "00",
    					ALAND: 134768872727,
    					AWATER: 2962859592,
    					full_name: "Arkansas",
    					nyt_name: "Ark.",
    					"label-text": "Ark.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-AR",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-AR"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					21122,
    					11578
    				],
    				properties: {
    					STATEFP: "18",
    					STATENS: "00448508",
    					AFFGEOID: "0400000US18",
    					GEOID: "18",
    					STUSPS: "IN",
    					NAME: "Indiana",
    					LSAD: "00",
    					ALAND: 92789302676,
    					AWATER: 1538002829,
    					full_name: "Indiana",
    					nyt_name: "Ind.",
    					"label-text": "Ind.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-IN",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-IN"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					16341,
    					16554
    				],
    				properties: {
    					STATEFP: "27",
    					STATENS: "00662849",
    					AFFGEOID: "0400000US27",
    					GEOID: "27",
    					STUSPS: "MN",
    					NAME: "Minnesota",
    					LSAD: "00",
    					ALAND: 206228939448,
    					AWATER: 18945217189,
    					full_name: "Minnesota",
    					nyt_name: "Minn.",
    					"label-text": "Minn.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-MN",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-MN"
    			},
    			{
    				type: "Point",
    				coordinates: [
    					28219,
    					14330
    				],
    				properties: {
    					STATEFP: "09",
    					STATENS: "01779780",
    					AFFGEOID: "0400000US09",
    					GEOID: "09",
    					STUSPS: "CT",
    					NAME: "Connecticut",
    					LSAD: "00",
    					ALAND: 12542497068,
    					AWATER: 1815617571,
    					full_name: "Connecticut",
    					nyt_name: "Conn.",
    					"label-text": "Conn.",
    					"class": "g-state-name",
    					ID_BUILDER: "g-state-CT",
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				},
    				id: "g-state-CT"
    			}
    		]
    	},
    	innerlines: {
    		type: "GeometryCollection",
    		geometries: [
    			{
    				type: "LineString",
    				arcs: [
    					0
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					1
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					2
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					4
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					8
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					10
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					11
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					12
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					13
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					14
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					15
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					16
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					17
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					18
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "MultiLineString",
    				arcs: [
    					[
    						19
    					],
    					[
    						22
    					],
    					[
    						24
    					]
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					21
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					23
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					26
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					27
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					28
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					29
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					30
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					31
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					34
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					36
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					43
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					44
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					47
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					50
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					51
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "MultiLineString",
    				arcs: [
    					[
    						53
    					],
    					[
    						55
    					]
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					56
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					57
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					58
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					60
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					61
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					62
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					63
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					64
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					68
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					70
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					71
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					72
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					73
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					74
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					75
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					76
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					83
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					86
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					87
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					89
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					90
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					91
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					92
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					93
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					94
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					97
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					105
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					106
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					107
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					110
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					111
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					113
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					114
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					117
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					118
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					120
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					121
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					122
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					123
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					124
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "MultiLineString",
    				arcs: [
    					[
    						125
    					],
    					[
    						127
    					]
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "MultiLineString",
    				arcs: [
    					[
    						126
    					],
    					[
    						128
    					]
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					129
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					130
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					131
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					132
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					133
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					134
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					135
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					136
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "MultiLineString",
    				arcs: [
    					[
    						137
    					],
    					[
    						138
    					]
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					139
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					140
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					143
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					144
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					146
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					171
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					172
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					173
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					174
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					176
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					177
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					179
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					181
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					182
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					183
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					186
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					189
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					192
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					210
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					212
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					213
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					215
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					221
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			},
    			{
    				type: "LineString",
    				arcs: [
    					224
    				],
    				properties: {
    					stroke: "#c2c2c2",
    					"stroke-width": 1
    				}
    			}
    		]
    	}
    };
    var theTopojson = {
    	type: type,
    	arcs: arcs,
    	transform: transform$1,
    	objects: objects
    };

    /* src/components/layercake/Tooltip.svelte generated by Svelte v3.32.2 */

    const file$6 = "src/components/layercake/Tooltip.svelte";
    const get_default_slot_changes$3 = dirty => ({ detail: dirty & /*evt*/ 1 });
    const get_default_slot_context$3 = ctx => ({ detail: /*evt*/ ctx[0].detail });

    // (19:0) {#if evt.detail}
    function create_if_block$3(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], get_default_slot_context$3);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "tooltip svelte-tbh15h");
    			set_style(div, "top", /*evt*/ ctx[0].detail.e.layerY - /*offset*/ ctx[1] + "px");
    			set_style(div, "left", /*evt*/ ctx[0].detail.e.layerX + "px");
    			add_location(div, file$6, 19, 2, 329);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope, evt*/ 5) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, get_default_slot_changes$3, get_default_slot_context$3);
    				}
    			}

    			if (!current || dirty & /*evt, offset*/ 3) {
    				set_style(div, "top", /*evt*/ ctx[0].detail.e.layerY - /*offset*/ ctx[1] + "px");
    			}

    			if (!current || dirty & /*evt*/ 1) {
    				set_style(div, "left", /*evt*/ ctx[0].detail.e.layerX + "px");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(19:0) {#if evt.detail}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*evt*/ ctx[0].detail && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*evt*/ ctx[0].detail) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*evt*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tooltip", slots, ['default']);
    	let { evt = {} } = $$props;
    	let { offset = 35 } = $$props;
    	const writable_props = ["evt", "offset"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tooltip> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("evt" in $$props) $$invalidate(0, evt = $$props.evt);
    		if ("offset" in $$props) $$invalidate(1, offset = $$props.offset);
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ evt, offset });

    	$$self.$inject_state = $$props => {
    		if ("evt" in $$props) $$invalidate(0, evt = $$props.evt);
    		if ("offset" in $$props) $$invalidate(1, offset = $$props.offset);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [evt, offset, $$scope, slots];
    }

    class Tooltip extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { evt: 0, offset: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tooltip",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get evt() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set evt(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get offset() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set offset(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.32.2 */

    const { console: console_1$3 } = globals;
    const file$7 = "src/App.svelte";

    // (59:8) <Svg>
    function create_default_slot_6(ctx) {
    	let map;
    	let current;

    	map = new Map_albers({
    			props: { collection_name: "states" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(map.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(map, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(map, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(59:8) <Svg>",
    		ctx
    	});

    	return block;
    }

    // (65:8) <Svg>
    function create_default_slot_5(ctx) {
    	let map;
    	let current;

    	map = new Map_albers({
    			props: {
    				collection_name: "innerlines",
    				base_collection_name: "states"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(map.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(map, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(map, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(65:8) <Svg>",
    		ctx
    	});

    	return block;
    }

    // (72:8) <Svg>
    function create_default_slot_4(ctx) {
    	let maplabels;
    	let current;

    	maplabels = new MapLabels_albers({
    			props: {
    				collection_name: "names",
    				base_collection_name: "states",
    				label_property: "nyt_name"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(maplabels.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(maplabels, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(maplabels.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(maplabels.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(maplabels, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(72:8) <Svg>",
    		ctx
    	});

    	return block;
    }

    // (81:8) <Svg zIndex={1}>
    function create_default_slot_3(ctx) {
    	let map;
    	let current;

    	map = new Map_albers({
    			props: {
    				collection_name: "states",
    				fill: "transparent",
    				strokeWidth: "0"
    			},
    			$$inline: true
    		});

    	map.$on("mousemove", /*mousemove_handler*/ ctx[4]);
    	map.$on("mouseout", /*mouseout_handler*/ ctx[5]);

    	const block = {
    		c: function create() {
    			create_component(map.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(map, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(map, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(81:8) <Svg zIndex={1}>",
    		ctx
    	});

    	return block;
    }

    // (96:10) {#if hideTooltip !== true}
    function create_if_block$4(ctx) {
    	let tooltip;
    	let current;

    	tooltip = new Tooltip({
    			props: {
    				evt: /*evt*/ ctx[2],
    				$$slots: {
    					default: [
    						create_default_slot_2,
    						({ detail }) => ({ 8: detail }),
    						({ detail }) => detail ? 256 : 0
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tooltip.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tooltip, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tooltip_changes = {};
    			if (dirty & /*evt*/ 4) tooltip_changes.evt = /*evt*/ ctx[2];

    			if (dirty & /*$$scope, detail*/ 768) {
    				tooltip_changes.$$scope = { dirty, ctx };
    			}

    			tooltip.$set(tooltip_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tooltip.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tooltip.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tooltip, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(96:10) {#if hideTooltip !== true}",
    		ctx
    	});

    	return block;
    }

    // (97:12) <Tooltip               {evt}               let:detail             >
    function create_default_slot_2(ctx) {
    	let div;
    	let span0;
    	let t0_value = /*detail*/ ctx[8].props.NAME + "";
    	let t0;
    	let br;
    	let t1;
    	let span1;
    	let t2_value = /*detail*/ ctx[8].props.Series_Complete_Pop_Pct + "";
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			t0 = text(t0_value);
    			br = element("br");
    			t1 = space();
    			span1 = element("span");
    			t2 = text(t2_value);
    			t3 = text("% vaccinated");
    			attr_dev(span0, "class", "tooltip-state svelte-1fkt0lk");
    			add_location(span0, file$7, 101, 16, 2950);
    			add_location(br, file$7, 101, 70, 3004);
    			attr_dev(span1, "class", "tooltip-info");
    			add_location(span1, file$7, 102, 16, 3027);
    			attr_dev(div, "class", "tooltip-box");
    			add_location(div, file$7, 100, 12, 2908);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(span0, t0);
    			append_dev(div, br);
    			append_dev(div, t1);
    			append_dev(div, span1);
    			append_dev(span1, t2);
    			append_dev(span1, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*detail*/ 256 && t0_value !== (t0_value = /*detail*/ ctx[8].props.NAME + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*detail*/ 256 && t2_value !== (t2_value = /*detail*/ ctx[8].props.Series_Complete_Pop_Pct + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(97:12) <Tooltip               {evt}               let:detail             >",
    		ctx
    	});

    	return block;
    }

    // (93:8) <Html           pointerEvents={false}         >
    function create_default_slot_1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*hideTooltip*/ ctx[1] !== true && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*hideTooltip*/ ctx[1] !== true) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*hideTooltip*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(93:8) <Html           pointerEvents={false}         >",
    		ctx
    	});

    	return block;
    }

    // (54:6) <LayerCake         z='FOO'         data={theTopojson}        >
    function create_default_slot(ctx) {
    	let svg0;
    	let t0;
    	let svg1;
    	let t1;
    	let svg2;
    	let t2;
    	let svg3;
    	let t3;
    	let html;
    	let current;

    	svg0 = new Svg({
    			props: {
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	svg1 = new Svg({
    			props: {
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	svg2 = new Svg({
    			props: {
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	svg3 = new Svg({
    			props: {
    				zIndex: 1,
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	html = new Html({
    			props: {
    				pointerEvents: false,
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(svg0.$$.fragment);
    			t0 = space();
    			create_component(svg1.$$.fragment);
    			t1 = space();
    			create_component(svg2.$$.fragment);
    			t2 = space();
    			create_component(svg3.$$.fragment);
    			t3 = space();
    			create_component(html.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(svg0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(svg1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(svg2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(svg3, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(html, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const svg0_changes = {};

    			if (dirty & /*$$scope*/ 512) {
    				svg0_changes.$$scope = { dirty, ctx };
    			}

    			svg0.$set(svg0_changes);
    			const svg1_changes = {};

    			if (dirty & /*$$scope*/ 512) {
    				svg1_changes.$$scope = { dirty, ctx };
    			}

    			svg1.$set(svg1_changes);
    			const svg2_changes = {};

    			if (dirty & /*$$scope*/ 512) {
    				svg2_changes.$$scope = { dirty, ctx };
    			}

    			svg2.$set(svg2_changes);
    			const svg3_changes = {};

    			if (dirty & /*$$scope, evt, hideTooltip*/ 518) {
    				svg3_changes.$$scope = { dirty, ctx };
    			}

    			svg3.$set(svg3_changes);
    			const html_changes = {};

    			if (dirty & /*$$scope, evt, hideTooltip*/ 518) {
    				html_changes.$$scope = { dirty, ctx };
    			}

    			html.$set(html_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(svg0.$$.fragment, local);
    			transition_in(svg1.$$.fragment, local);
    			transition_in(svg2.$$.fragment, local);
    			transition_in(svg3.$$.fragment, local);
    			transition_in(html.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(svg0.$$.fragment, local);
    			transition_out(svg1.$$.fragment, local);
    			transition_out(svg2.$$.fragment, local);
    			transition_out(svg3.$$.fragment, local);
    			transition_out(html.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(svg0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(svg1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(svg2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(svg3, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(html, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(54:6) <LayerCake         z='FOO'         data={theTopojson}        >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let p0;
    	let t3;
    	let mapkey;
    	let t4;
    	let div;
    	let layercake;
    	let div_resize_listener;
    	let t5;
    	let p1;
    	let t6;
    	let t7;
    	let t8;
    	let a;
    	let t10;
    	let current;

    	mapkey = new MapKey({
    			props: {
    				hed: "",
    				subhed: "Portion fully vaccinated",
    				color_string: "#fff7fb,#ede5f1,#d5d5e8,#b3c4df,#83b2d4,#529ec8,#258bac,#067c80,#016657,#014636",
    				level_breaks_string: " ,10%,20%,30%,40%,50%,60%,70%,80%,90%"
    			},
    			$$inline: true
    		});

    	layercake = new LayerCake({
    			props: {
    				z: "FOO",
    				data: theTopojson,
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Fully vaccinated across the U.S.";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Percentage of the state's adult population who've received both doses of Pfizer or Moderna shots, or the single-dose Johnson & Johnson shot.";
    			t3 = space();
    			create_component(mapkey.$$.fragment);
    			t4 = space();
    			div = element("div");
    			create_component(layercake.$$.fragment);
    			t5 = space();
    			p1 = element("p");
    			t6 = text("Data as of ");
    			t7 = text(/*as_of*/ ctx[3]);
    			t8 = text(" | Source: Centers for Disease Control and Prevention | Get the ");
    			a = element("a");
    			a.textContent = "data";
    			t10 = text(" | By John Keefe");
    			attr_dev(h1, "class", "svelte-1fkt0lk");
    			add_location(h1, file$7, 40, 1, 1208);
    			attr_dev(p0, "class", "g-leadin svelte-1fkt0lk");
    			add_location(p0, file$7, 42, 1, 1256);
    			attr_dev(div, "class", "chart-container svelte-1fkt0lk");
    			set_style(div, "height", /*w*/ ctx[0] * height_from_width + "px ");
    			add_render_callback(() => /*div_elementresize_handler*/ ctx[6].call(div));
    			add_location(div, file$7, 52, 4, 1742);
    			attr_dev(a, "href", "https://covid.cdc.gov/covid-data-tracker/COVIDData/getAjaxData?id=vaccination_data");
    			add_location(a, file$7, 120, 105, 3537);
    			attr_dev(p1, "class", "g-notes svelte-1fkt0lk");
    			add_location(p1, file$7, 120, 4, 3436);
    			attr_dev(main, "class", "svelte-1fkt0lk");
    			add_location(main, file$7, 38, 0, 1199);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, p0);
    			append_dev(main, t3);
    			mount_component(mapkey, main, null);
    			append_dev(main, t4);
    			append_dev(main, div);
    			mount_component(layercake, div, null);
    			div_resize_listener = add_resize_listener(div, /*div_elementresize_handler*/ ctx[6].bind(div));
    			append_dev(main, t5);
    			append_dev(main, p1);
    			append_dev(p1, t6);
    			append_dev(p1, t7);
    			append_dev(p1, t8);
    			append_dev(p1, a);
    			append_dev(p1, t10);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const layercake_changes = {};

    			if (dirty & /*$$scope, evt, hideTooltip*/ 518) {
    				layercake_changes.$$scope = { dirty, ctx };
    			}

    			layercake.$set(layercake_changes);

    			if (!current || dirty & /*w*/ 1) {
    				set_style(div, "height", /*w*/ ctx[0] * height_from_width + "px ");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(mapkey.$$.fragment, local);
    			transition_in(layercake.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(mapkey.$$.fragment, local);
    			transition_out(layercake.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(mapkey);
    			destroy_component(layercake);
    			div_resize_listener();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const height_from_width = 0.6;

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	dayjs_min.extend(updateLocale);

    	dayjs_min.updateLocale("en", {
    		monthsShort: [
    			"Jan.",
    			"Feb.",
    			"March",
    			"April",
    			"May",
    			"June",
    			"July",
    			"Aug.",
    			"Sept.",
    			"Oct.",
    			"Nov.",
    			"Dec."
    		]
    	});

    	let as_of = dayjs_min(updated_date.as_of).format("MMM D, YYYY");
    	console.log(as_of);
    	let w;
    	const addCommas = format(",");
    	let hideTooltip = true;
    	let evt;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const mousemove_handler = event => $$invalidate(2, evt = $$invalidate(1, hideTooltip = event));
    	const mouseout_handler = () => $$invalidate(1, hideTooltip = true);

    	function div_elementresize_handler() {
    		w = this.clientWidth;
    		$$invalidate(0, w);
    	}

    	$$self.$capture_state = () => ({
    		LayerCake,
    		Html,
    		Svg,
    		MapKey,
    		Map: Map_albers,
    		MapLabels: MapLabels_albers,
    		dayjs: dayjs_min,
    		updateLocale,
    		updated_date,
    		as_of,
    		theTopojson,
    		height_from_width,
    		w,
    		Tooltip,
    		format,
    		addCommas,
    		hideTooltip,
    		evt
    	});

    	$$self.$inject_state = $$props => {
    		if ("as_of" in $$props) $$invalidate(3, as_of = $$props.as_of);
    		if ("w" in $$props) $$invalidate(0, w = $$props.w);
    		if ("hideTooltip" in $$props) $$invalidate(1, hideTooltip = $$props.hideTooltip);
    		if ("evt" in $$props) $$invalidate(2, evt = $$props.evt);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		w,
    		hideTooltip,
    		evt,
    		as_of,
    		mousemove_handler,
    		mouseout_handler,
    		div_elementresize_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    var hydrate = false;
    var config = {
    	hydrate: hydrate
    };

    const app = new App({
        target: document.body,
        hydrate: config.hydrate
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
