
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

    /* src/components/smarts/MapKey.svelte generated by Svelte v3.32.2 */

    const file = "src/components/smarts/MapKey.svelte";

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
    			add_location(div0, file, 29, 20, 858);
    			attr_dev(div1, "class", "bar svelte-1azrjgf");
    			add_location(div1, file, 28, 16, 820);
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
    			add_location(div0, file, 25, 20, 696);
    			attr_dev(div1, "class", "bar bar-tick svelte-1azrjgf");
    			add_location(div1, file, 24, 16, 649);
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
    			add_location(div0, file, 38, 20, 1097);
    			attr_dev(div1, "class", "bar bar-last svelte-1azrjgf");
    			add_location(div1, file, 37, 16, 1050);
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
    			add_location(span, file, 48, 24, 1399);
    			attr_dev(div, "class", "level-label svelte-1azrjgf");
    			add_location(div, file, 47, 16, 1349);
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
    function create_if_block(ctx) {
    	let div;
    	let span;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			span.textContent = "No data";
    			attr_dev(span, "class", "svelte-1azrjgf");
    			add_location(span, file, 54, 20, 1583);
    			attr_dev(div, "class", "level-label svelte-1azrjgf");
    			add_location(div, file, 53, 16, 1537);
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
    		id: create_if_block.name,
    		type: "if",
    		source: "(53:12) {#if has_missing_data}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
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

    	let if_block1 = /*has_missing_data*/ ctx[2] && create_if_block(ctx);

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
    			add_location(div0, file, 16, 8, 410);
    			attr_dev(div1, "class", "map-key-subhed svelte-1azrjgf");
    			add_location(div1, file, 17, 8, 455);
    			attr_dev(div2, "class", "bars svelte-1azrjgf");
    			add_location(div2, file, 19, 8, 507);
    			attr_dev(div3, "class", "level-labels svelte-1azrjgf");
    			add_location(div3, file, 44, 8, 1249);
    			attr_dev(p, "class", "map-interaction-tip svelte-1azrjgf");
    			add_location(p, file, 60, 8, 1690);
    			attr_dev(div4, "class", "map-key svelte-1azrjgf");
    			add_location(div4, file, 15, 4, 380);
    			add_location(main, file, 14, 0, 369);
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
    					if_block1 = create_if_block(ctx);
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
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
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

    		init(this, options, instance, create_fragment, safe_not_equal, {
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
    			id: create_fragment.name
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

    /* src/components/smarts/SvgImage.svelte generated by Svelte v3.32.2 */

    const file$1 = "src/components/smarts/SvgImage.svelte";

    function create_fragment$1(ctx) {
    	let main;
    	let div;
    	let img;
    	let img_src_value;
    	let div_resize_listener;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			img = element("img");
    			if (img.src !== (img_src_value = /*filename*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "width", /*w*/ ctx[1]);
    			add_location(img, file$1, 7, 5, 97);
    			add_render_callback(() => /*div_elementresize_handler*/ ctx[2].call(div));
    			add_location(div, file$1, 6, 4, 65);
    			add_location(main, file$1, 5, 0, 54);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(div, img);
    			div_resize_listener = add_resize_listener(div, /*div_elementresize_handler*/ ctx[2].bind(div));
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*filename*/ 1 && img.src !== (img_src_value = /*filename*/ ctx[0])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*w*/ 2) {
    				attr_dev(img, "width", /*w*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			div_resize_listener();
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SvgImage", slots, []);
    	let { filename } = $$props;
    	let w;
    	const writable_props = ["filename"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SvgImage> was created with unknown prop '${key}'`);
    	});

    	function div_elementresize_handler() {
    		w = this.clientWidth;
    		$$invalidate(1, w);
    	}

    	$$self.$$set = $$props => {
    		if ("filename" in $$props) $$invalidate(0, filename = $$props.filename);
    	};

    	$$self.$capture_state = () => ({ filename, w });

    	$$self.$inject_state = $$props => {
    		if ("filename" in $$props) $$invalidate(0, filename = $$props.filename);
    		if ("w" in $$props) $$invalidate(1, w = $$props.w);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [filename, w, div_elementresize_handler];
    }

    class SvgImage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { filename: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SvgImage",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*filename*/ ctx[0] === undefined && !("filename" in props)) {
    			console.warn("<SvgImage> was created without expected prop 'filename'");
    		}
    	}

    	get filename() {
    		throw new Error("<SvgImage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set filename(value) {
    		throw new Error("<SvgImage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/smarts/HtmlRender.svelte generated by Svelte v3.32.2 */

    const { console: console_1 } = globals;
    const file$2 = "src/components/smarts/HtmlRender.svelte";

    function create_fragment$2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			add_location(p, file$2, 13, 0, 218);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			p.innerHTML = /*htmlContent*/ ctx[0];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*htmlContent*/ 1) p.innerHTML = /*htmlContent*/ ctx[0];		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("HtmlRender", slots, []);
    	let { filename = "" } = $$props;
    	let htmlContent = "";

    	fetch(`./${filename}`).then(response => {
    		console.dir(response);
    		return response.text();
    	}).then(html => {
    		$$invalidate(0, htmlContent = html);
    	});

    	const writable_props = ["filename"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<HtmlRender> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("filename" in $$props) $$invalidate(1, filename = $$props.filename);
    	};

    	$$self.$capture_state = () => ({ filename, htmlContent });

    	$$self.$inject_state = $$props => {
    		if ("filename" in $$props) $$invalidate(1, filename = $$props.filename);
    		if ("htmlContent" in $$props) $$invalidate(0, htmlContent = $$props.htmlContent);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [htmlContent, filename];
    }

    class HtmlRender extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { filename: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HtmlRender",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get filename() {
    		throw new Error("<HtmlRender>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set filename(value) {
    		throw new Error("<HtmlRender>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
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

    const { Object: Object_1, console: console_1$1 } = globals;
    const file$3 = "node_modules/layercake/src/LayerCake.svelte";

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
    function create_if_block$1(ctx) {
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
    			add_location(div, file$3, 295, 1, 9437);
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
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(295:0) {#if (ssr === true || typeof window !== 'undefined')}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = (/*ssr*/ ctx[3] === true || typeof window !== "undefined") && create_if_block$1(ctx);

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
    					if_block = create_if_block$1(ctx);
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<LayerCake> was created with unknown prop '${key}'`);
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
    			instance$3,
    			create_fragment$3,
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
    			id: create_fragment$3.name
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
    const file$4 = "node_modules/layercake/src/layouts/Html.svelte";
    const get_default_slot_changes$1 = dirty => ({ element: dirty & /*element*/ 1 });
    const get_default_slot_context$1 = ctx => ({ element: /*element*/ ctx[0] });

    function create_fragment$4(ctx) {
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
    			add_location(div, file$4, 16, 0, 422);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { element: 0, zIndex: 5, pointerEvents: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Html",
    			options,
    			id: create_fragment$4.name
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
    const file$5 = "node_modules/layercake/src/layouts/Svg.svelte";
    const get_default_slot_changes$2 = dirty => ({ element: dirty & /*element*/ 1 });
    const get_default_slot_context$2 = ctx => ({ element: /*element*/ ctx[0] });
    const get_defs_slot_changes = dirty => ({ element: dirty & /*element*/ 1 });
    const get_defs_slot_context = ctx => ({ element: /*element*/ ctx[0] });

    function create_fragment$5(ctx) {
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
    			add_location(defs, file$5, 24, 1, 652);
    			attr_dev(g, "class", "layercake-layout-svg_g");
    			attr_dev(g, "transform", g_transform_value = "translate(" + /*$padding*/ ctx[6].left + ", " + /*$padding*/ ctx[6].top + ")");
    			add_location(g, file$5, 27, 1, 697);
    			attr_dev(svg, "class", "layercake-layout-svg svelte-u84d8d");
    			attr_dev(svg, "viewBox", /*viewBox*/ ctx[1]);
    			attr_dev(svg, "width", /*$containerWidth*/ ctx[4]);
    			attr_dev(svg, "height", /*$containerHeight*/ ctx[5]);
    			attr_dev(svg, "style", svg_style_value = "" + (/*zIndexStyle*/ ctx[2] + /*pointerEventsStyle*/ ctx[3]));
    			add_location(svg, file$5, 16, 0, 487);
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			element: 0,
    			viewBox: 1,
    			zIndex: 10,
    			pointerEvents: 11
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Svg",
    			options,
    			id: create_fragment$5.name
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

    function identity$3(x) {
      return x;
    }

    function transform(transform) {
      if (transform == null) return identity$3;
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

    var epsilon = 1e-6;
    var epsilon2 = 1e-12;
    var pi = Math.PI;
    var halfPi = pi / 2;
    var quarterPi = pi / 4;
    var tau = pi * 2;

    var degrees = 180 / pi;
    var radians = pi / 180;

    var abs = Math.abs;
    var atan = Math.atan;
    var atan2 = Math.atan2;
    var cos = Math.cos;
    var sin = Math.sin;
    var sign = Math.sign || function(x) { return x > 0 ? 1 : x < 0 ? -1 : 0; };
    var sqrt$1 = Math.sqrt;

    function acos(x) {
      return x > 1 ? 0 : x < -1 ? pi : Math.acos(x);
    }

    function asin(x) {
      return x > 1 ? halfPi : x < -1 ? -halfPi : Math.asin(x);
    }

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

    function spherical(cartesian) {
      return [atan2(cartesian[1], cartesian[0]), asin(cartesian[2])];
    }

    function cartesian(spherical) {
      var lambda = spherical[0], phi = spherical[1], cosPhi = cos(phi);
      return [cosPhi * cos(lambda), cosPhi * sin(lambda), sin(phi)];
    }

    function cartesianDot(a, b) {
      return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }

    function cartesianCross(a, b) {
      return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    }

    // TODO return a
    function cartesianAddInPlace(a, b) {
      a[0] += b[0], a[1] += b[1], a[2] += b[2];
    }

    function cartesianScale(vector, k) {
      return [vector[0] * k, vector[1] * k, vector[2] * k];
    }

    // TODO return d
    function cartesianNormalizeInPlace(d) {
      var l = sqrt$1(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
      d[0] /= l, d[1] /= l, d[2] /= l;
    }

    function compose(a, b) {

      function compose(x, y) {
        return x = a(x, y), b(x[0], x[1]);
      }

      if (a.invert && b.invert) compose.invert = function(x, y) {
        return x = b.invert(x, y), x && a.invert(x[0], x[1]);
      };

      return compose;
    }

    function rotationIdentity(lambda, phi) {
      return [abs(lambda) > pi ? lambda + Math.round(-lambda / tau) * tau : lambda, phi];
    }

    rotationIdentity.invert = rotationIdentity;

    function rotateRadians(deltaLambda, deltaPhi, deltaGamma) {
      return (deltaLambda %= tau) ? (deltaPhi || deltaGamma ? compose(rotationLambda(deltaLambda), rotationPhiGamma(deltaPhi, deltaGamma))
        : rotationLambda(deltaLambda))
        : (deltaPhi || deltaGamma ? rotationPhiGamma(deltaPhi, deltaGamma)
        : rotationIdentity);
    }

    function forwardRotationLambda(deltaLambda) {
      return function(lambda, phi) {
        return lambda += deltaLambda, [lambda > pi ? lambda - tau : lambda < -pi ? lambda + tau : lambda, phi];
      };
    }

    function rotationLambda(deltaLambda) {
      var rotation = forwardRotationLambda(deltaLambda);
      rotation.invert = forwardRotationLambda(-deltaLambda);
      return rotation;
    }

    function rotationPhiGamma(deltaPhi, deltaGamma) {
      var cosDeltaPhi = cos(deltaPhi),
          sinDeltaPhi = sin(deltaPhi),
          cosDeltaGamma = cos(deltaGamma),
          sinDeltaGamma = sin(deltaGamma);

      function rotation(lambda, phi) {
        var cosPhi = cos(phi),
            x = cos(lambda) * cosPhi,
            y = sin(lambda) * cosPhi,
            z = sin(phi),
            k = z * cosDeltaPhi + x * sinDeltaPhi;
        return [
          atan2(y * cosDeltaGamma - k * sinDeltaGamma, x * cosDeltaPhi - z * sinDeltaPhi),
          asin(k * cosDeltaGamma + y * sinDeltaGamma)
        ];
      }

      rotation.invert = function(lambda, phi) {
        var cosPhi = cos(phi),
            x = cos(lambda) * cosPhi,
            y = sin(lambda) * cosPhi,
            z = sin(phi),
            k = z * cosDeltaGamma - y * sinDeltaGamma;
        return [
          atan2(y * cosDeltaGamma + z * sinDeltaGamma, x * cosDeltaPhi + k * sinDeltaPhi),
          asin(k * cosDeltaPhi - x * sinDeltaPhi)
        ];
      };

      return rotation;
    }

    // Generates a circle centered at [0°, 0°], with a given radius and precision.
    function circleStream(stream, radius, delta, direction, t0, t1) {
      if (!delta) return;
      var cosRadius = cos(radius),
          sinRadius = sin(radius),
          step = direction * delta;
      if (t0 == null) {
        t0 = radius + direction * tau;
        t1 = radius - step / 2;
      } else {
        t0 = circleRadius(cosRadius, t0);
        t1 = circleRadius(cosRadius, t1);
        if (direction > 0 ? t0 < t1 : t0 > t1) t0 += direction * tau;
      }
      for (var point, t = t0; direction > 0 ? t > t1 : t < t1; t -= step) {
        point = spherical([cosRadius, -sinRadius * cos(t), -sinRadius * sin(t)]);
        stream.point(point[0], point[1]);
      }
    }

    // Returns the signed angle of a cartesian point relative to [cosRadius, 0, 0].
    function circleRadius(cosRadius, point) {
      point = cartesian(point), point[0] -= cosRadius;
      cartesianNormalizeInPlace(point);
      var radius = acos(-point[1]);
      return ((-point[2] < 0 ? -radius : radius) + tau - epsilon) % tau;
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

    function longitude(point) {
      if (abs(point[0]) <= pi)
        return point[0];
      else
        return sign(point[0]) * ((abs(point[0]) + pi) % tau - pi);
    }

    function polygonContains(polygon, point) {
      var lambda = longitude(point),
          phi = point[1],
          sinPhi = sin(phi),
          normal = [sin(lambda), -cos(lambda), 0],
          angle = 0,
          winding = 0;

      var sum = new Adder();

      if (sinPhi === 1) phi = halfPi + epsilon;
      else if (sinPhi === -1) phi = -halfPi - epsilon;

      for (var i = 0, n = polygon.length; i < n; ++i) {
        if (!(m = (ring = polygon[i]).length)) continue;
        var ring,
            m,
            point0 = ring[m - 1],
            lambda0 = longitude(point0),
            phi0 = point0[1] / 2 + quarterPi,
            sinPhi0 = sin(phi0),
            cosPhi0 = cos(phi0);

        for (var j = 0; j < m; ++j, lambda0 = lambda1, sinPhi0 = sinPhi1, cosPhi0 = cosPhi1, point0 = point1) {
          var point1 = ring[j],
              lambda1 = longitude(point1),
              phi1 = point1[1] / 2 + quarterPi,
              sinPhi1 = sin(phi1),
              cosPhi1 = cos(phi1),
              delta = lambda1 - lambda0,
              sign = delta >= 0 ? 1 : -1,
              absDelta = sign * delta,
              antimeridian = absDelta > pi,
              k = sinPhi0 * sinPhi1;

          sum.add(atan2(k * sign * sin(absDelta), cosPhi0 * cosPhi1 + k * cos(absDelta)));
          angle += antimeridian ? delta + sign * tau : delta;

          // Are the longitudes either side of the point’s meridian (lambda),
          // and are the latitudes smaller than the parallel (phi)?
          if (antimeridian ^ lambda0 >= lambda ^ lambda1 >= lambda) {
            var arc = cartesianCross(cartesian(point0), cartesian(point1));
            cartesianNormalizeInPlace(arc);
            var intersection = cartesianCross(normal, arc);
            cartesianNormalizeInPlace(intersection);
            var phiArc = (antimeridian ^ delta >= 0 ? -1 : 1) * asin(intersection[2]);
            if (phi > phiArc || phi === phiArc && (arc[0] || arc[1])) {
              winding += antimeridian ^ delta >= 0 ? 1 : -1;
            }
          }
        }
      }

      // First, determine whether the South pole is inside or outside:
      //
      // It is inside if:
      // * the polygon winds around it in a clockwise direction.
      // * the polygon does not (cumulatively) wind around it, but has a negative
      //   (counter-clockwise) area.
      //
      // Second, count the (signed) number of times a segment crosses a lambda
      // from the point to the South pole.  If it is zero, then the point is the
      // same side as the South pole.

      return (angle < -epsilon || angle < epsilon && sum < -epsilon2) ^ (winding & 1);
    }

    function clip(pointVisible, clipLine, interpolate, start) {
      return function(sink) {
        var line = clipLine(sink),
            ringBuffer = clipBuffer(),
            ringSink = clipLine(ringBuffer),
            polygonStarted = false,
            polygon,
            segments,
            ring;

        var clip = {
          point: point,
          lineStart: lineStart,
          lineEnd: lineEnd,
          polygonStart: function() {
            clip.point = pointRing;
            clip.lineStart = ringStart;
            clip.lineEnd = ringEnd;
            segments = [];
            polygon = [];
          },
          polygonEnd: function() {
            clip.point = point;
            clip.lineStart = lineStart;
            clip.lineEnd = lineEnd;
            segments = merge(segments);
            var startInside = polygonContains(polygon, start);
            if (segments.length) {
              if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
              clipRejoin(segments, compareIntersection, startInside, interpolate, sink);
            } else if (startInside) {
              if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
              sink.lineStart();
              interpolate(null, null, 1, sink);
              sink.lineEnd();
            }
            if (polygonStarted) sink.polygonEnd(), polygonStarted = false;
            segments = polygon = null;
          },
          sphere: function() {
            sink.polygonStart();
            sink.lineStart();
            interpolate(null, null, 1, sink);
            sink.lineEnd();
            sink.polygonEnd();
          }
        };

        function point(lambda, phi) {
          if (pointVisible(lambda, phi)) sink.point(lambda, phi);
        }

        function pointLine(lambda, phi) {
          line.point(lambda, phi);
        }

        function lineStart() {
          clip.point = pointLine;
          line.lineStart();
        }

        function lineEnd() {
          clip.point = point;
          line.lineEnd();
        }

        function pointRing(lambda, phi) {
          ring.push([lambda, phi]);
          ringSink.point(lambda, phi);
        }

        function ringStart() {
          ringSink.lineStart();
          ring = [];
        }

        function ringEnd() {
          pointRing(ring[0][0], ring[0][1]);
          ringSink.lineEnd();

          var clean = ringSink.clean(),
              ringSegments = ringBuffer.result(),
              i, n = ringSegments.length, m,
              segment,
              point;

          ring.pop();
          polygon.push(ring);
          ring = null;

          if (!n) return;

          // No intersections.
          if (clean & 1) {
            segment = ringSegments[0];
            if ((m = segment.length - 1) > 0) {
              if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
              sink.lineStart();
              for (i = 0; i < m; ++i) sink.point((point = segment[i])[0], point[1]);
              sink.lineEnd();
            }
            return;
          }

          // Rejoin connected segments.
          // TODO reuse ringBuffer.rejoin()?
          if (n > 1 && clean & 2) ringSegments.push(ringSegments.pop().concat(ringSegments.shift()));

          segments.push(ringSegments.filter(validSegment));
        }

        return clip;
      };
    }

    function validSegment(segment) {
      return segment.length > 1;
    }

    // Intersections are sorted along the clip edge. For both antimeridian cutting
    // and circle clipping, the same comparison is used.
    function compareIntersection(a, b) {
      return ((a = a.x)[0] < 0 ? a[1] - halfPi - epsilon : halfPi - a[1])
           - ((b = b.x)[0] < 0 ? b[1] - halfPi - epsilon : halfPi - b[1]);
    }

    var clipAntimeridian = clip(
      function() { return true; },
      clipAntimeridianLine,
      clipAntimeridianInterpolate,
      [-pi, -halfPi]
    );

    // Takes a line and cuts into visible segments. Return values: 0 - there were
    // intersections or the line was empty; 1 - no intersections; 2 - there were
    // intersections, and the first and last segments should be rejoined.
    function clipAntimeridianLine(stream) {
      var lambda0 = NaN,
          phi0 = NaN,
          sign0 = NaN,
          clean; // no intersections

      return {
        lineStart: function() {
          stream.lineStart();
          clean = 1;
        },
        point: function(lambda1, phi1) {
          var sign1 = lambda1 > 0 ? pi : -pi,
              delta = abs(lambda1 - lambda0);
          if (abs(delta - pi) < epsilon) { // line crosses a pole
            stream.point(lambda0, phi0 = (phi0 + phi1) / 2 > 0 ? halfPi : -halfPi);
            stream.point(sign0, phi0);
            stream.lineEnd();
            stream.lineStart();
            stream.point(sign1, phi0);
            stream.point(lambda1, phi0);
            clean = 0;
          } else if (sign0 !== sign1 && delta >= pi) { // line crosses antimeridian
            if (abs(lambda0 - sign0) < epsilon) lambda0 -= sign0 * epsilon; // handle degeneracies
            if (abs(lambda1 - sign1) < epsilon) lambda1 -= sign1 * epsilon;
            phi0 = clipAntimeridianIntersect(lambda0, phi0, lambda1, phi1);
            stream.point(sign0, phi0);
            stream.lineEnd();
            stream.lineStart();
            stream.point(sign1, phi0);
            clean = 0;
          }
          stream.point(lambda0 = lambda1, phi0 = phi1);
          sign0 = sign1;
        },
        lineEnd: function() {
          stream.lineEnd();
          lambda0 = phi0 = NaN;
        },
        clean: function() {
          return 2 - clean; // if intersections, rejoin first and last segments
        }
      };
    }

    function clipAntimeridianIntersect(lambda0, phi0, lambda1, phi1) {
      var cosPhi0,
          cosPhi1,
          sinLambda0Lambda1 = sin(lambda0 - lambda1);
      return abs(sinLambda0Lambda1) > epsilon
          ? atan((sin(phi0) * (cosPhi1 = cos(phi1)) * sin(lambda1)
              - sin(phi1) * (cosPhi0 = cos(phi0)) * sin(lambda0))
              / (cosPhi0 * cosPhi1 * sinLambda0Lambda1))
          : (phi0 + phi1) / 2;
    }

    function clipAntimeridianInterpolate(from, to, direction, stream) {
      var phi;
      if (from == null) {
        phi = direction * halfPi;
        stream.point(-pi, phi);
        stream.point(0, phi);
        stream.point(pi, phi);
        stream.point(pi, 0);
        stream.point(pi, -phi);
        stream.point(0, -phi);
        stream.point(-pi, -phi);
        stream.point(-pi, 0);
        stream.point(-pi, phi);
      } else if (abs(from[0] - to[0]) > epsilon) {
        var lambda = from[0] < to[0] ? pi : -pi;
        phi = direction * lambda / 2;
        stream.point(-lambda, phi);
        stream.point(0, phi);
        stream.point(lambda, phi);
      } else {
        stream.point(to[0], to[1]);
      }
    }

    function clipCircle(radius) {
      var cr = cos(radius),
          delta = 6 * radians,
          smallRadius = cr > 0,
          notHemisphere = abs(cr) > epsilon; // TODO optimise for this common case

      function interpolate(from, to, direction, stream) {
        circleStream(stream, radius, delta, direction, from, to);
      }

      function visible(lambda, phi) {
        return cos(lambda) * cos(phi) > cr;
      }

      // Takes a line and cuts into visible segments. Return values used for polygon
      // clipping: 0 - there were intersections or the line was empty; 1 - no
      // intersections 2 - there were intersections, and the first and last segments
      // should be rejoined.
      function clipLine(stream) {
        var point0, // previous point
            c0, // code for previous point
            v0, // visibility of previous point
            v00, // visibility of first point
            clean; // no intersections
        return {
          lineStart: function() {
            v00 = v0 = false;
            clean = 1;
          },
          point: function(lambda, phi) {
            var point1 = [lambda, phi],
                point2,
                v = visible(lambda, phi),
                c = smallRadius
                  ? v ? 0 : code(lambda, phi)
                  : v ? code(lambda + (lambda < 0 ? pi : -pi), phi) : 0;
            if (!point0 && (v00 = v0 = v)) stream.lineStart();
            if (v !== v0) {
              point2 = intersect(point0, point1);
              if (!point2 || pointEqual(point0, point2) || pointEqual(point1, point2))
                point1[2] = 1;
            }
            if (v !== v0) {
              clean = 0;
              if (v) {
                // outside going in
                stream.lineStart();
                point2 = intersect(point1, point0);
                stream.point(point2[0], point2[1]);
              } else {
                // inside going out
                point2 = intersect(point0, point1);
                stream.point(point2[0], point2[1], 2);
                stream.lineEnd();
              }
              point0 = point2;
            } else if (notHemisphere && point0 && smallRadius ^ v) {
              var t;
              // If the codes for two points are different, or are both zero,
              // and there this segment intersects with the small circle.
              if (!(c & c0) && (t = intersect(point1, point0, true))) {
                clean = 0;
                if (smallRadius) {
                  stream.lineStart();
                  stream.point(t[0][0], t[0][1]);
                  stream.point(t[1][0], t[1][1]);
                  stream.lineEnd();
                } else {
                  stream.point(t[1][0], t[1][1]);
                  stream.lineEnd();
                  stream.lineStart();
                  stream.point(t[0][0], t[0][1], 3);
                }
              }
            }
            if (v && (!point0 || !pointEqual(point0, point1))) {
              stream.point(point1[0], point1[1]);
            }
            point0 = point1, v0 = v, c0 = c;
          },
          lineEnd: function() {
            if (v0) stream.lineEnd();
            point0 = null;
          },
          // Rejoin first and last segments if there were intersections and the first
          // and last points were visible.
          clean: function() {
            return clean | ((v00 && v0) << 1);
          }
        };
      }

      // Intersects the great circle between a and b with the clip circle.
      function intersect(a, b, two) {
        var pa = cartesian(a),
            pb = cartesian(b);

        // We have two planes, n1.p = d1 and n2.p = d2.
        // Find intersection line p(t) = c1 n1 + c2 n2 + t (n1 ⨯ n2).
        var n1 = [1, 0, 0], // normal
            n2 = cartesianCross(pa, pb),
            n2n2 = cartesianDot(n2, n2),
            n1n2 = n2[0], // cartesianDot(n1, n2),
            determinant = n2n2 - n1n2 * n1n2;

        // Two polar points.
        if (!determinant) return !two && a;

        var c1 =  cr * n2n2 / determinant,
            c2 = -cr * n1n2 / determinant,
            n1xn2 = cartesianCross(n1, n2),
            A = cartesianScale(n1, c1),
            B = cartesianScale(n2, c2);
        cartesianAddInPlace(A, B);

        // Solve |p(t)|^2 = 1.
        var u = n1xn2,
            w = cartesianDot(A, u),
            uu = cartesianDot(u, u),
            t2 = w * w - uu * (cartesianDot(A, A) - 1);

        if (t2 < 0) return;

        var t = sqrt$1(t2),
            q = cartesianScale(u, (-w - t) / uu);
        cartesianAddInPlace(q, A);
        q = spherical(q);

        if (!two) return q;

        // Two intersection points.
        var lambda0 = a[0],
            lambda1 = b[0],
            phi0 = a[1],
            phi1 = b[1],
            z;

        if (lambda1 < lambda0) z = lambda0, lambda0 = lambda1, lambda1 = z;

        var delta = lambda1 - lambda0,
            polar = abs(delta - pi) < epsilon,
            meridian = polar || delta < epsilon;

        if (!polar && phi1 < phi0) z = phi0, phi0 = phi1, phi1 = z;

        // Check that the first point is between a and b.
        if (meridian
            ? polar
              ? phi0 + phi1 > 0 ^ q[1] < (abs(q[0] - lambda0) < epsilon ? phi0 : phi1)
              : phi0 <= q[1] && q[1] <= phi1
            : delta > pi ^ (lambda0 <= q[0] && q[0] <= lambda1)) {
          var q1 = cartesianScale(u, (-w + t) / uu);
          cartesianAddInPlace(q1, A);
          return [q, spherical(q1)];
        }
      }

      // Generates a 4-bit vector representing the location of a point relative to
      // the small circle's bounding box.
      function code(lambda, phi) {
        var r = smallRadius ? radius : pi - radius,
            code = 0;
        if (lambda < -r) code |= 1; // left
        else if (lambda > r) code |= 2; // right
        if (phi < -r) code |= 4; // below
        else if (phi > r) code |= 8; // above
        return code;
      }

      return clip(visible, clipLine, interpolate, smallRadius ? [0, -radius] : [-pi, radius - pi]);
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

    var identity$4 = x => x;

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
        return arguments.length ? (projectionStream = _ == null ? (projection = null, identity$4) : (projection = _).stream, path) : projection;
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

    var maxDepth = 16, // maximum depth of subdivision
        cosMinDistance = cos(30 * radians); // cos(minimum angular distance)

    function resample(project, delta2) {
      return +delta2 ? resample$1(project, delta2) : resampleNone(project);
    }

    function resampleNone(project) {
      return transformer$1({
        point: function(x, y) {
          x = project(x, y);
          this.stream.point(x[0], x[1]);
        }
      });
    }

    function resample$1(project, delta2) {

      function resampleLineTo(x0, y0, lambda0, a0, b0, c0, x1, y1, lambda1, a1, b1, c1, depth, stream) {
        var dx = x1 - x0,
            dy = y1 - y0,
            d2 = dx * dx + dy * dy;
        if (d2 > 4 * delta2 && depth--) {
          var a = a0 + a1,
              b = b0 + b1,
              c = c0 + c1,
              m = sqrt$1(a * a + b * b + c * c),
              phi2 = asin(c /= m),
              lambda2 = abs(abs(c) - 1) < epsilon || abs(lambda0 - lambda1) < epsilon ? (lambda0 + lambda1) / 2 : atan2(b, a),
              p = project(lambda2, phi2),
              x2 = p[0],
              y2 = p[1],
              dx2 = x2 - x0,
              dy2 = y2 - y0,
              dz = dy * dx2 - dx * dy2;
          if (dz * dz / d2 > delta2 // perpendicular projected distance
              || abs((dx * dx2 + dy * dy2) / d2 - 0.5) > 0.3 // midpoint close to an end
              || a0 * a1 + b0 * b1 + c0 * c1 < cosMinDistance) { // angular distance
            resampleLineTo(x0, y0, lambda0, a0, b0, c0, x2, y2, lambda2, a /= m, b /= m, c, depth, stream);
            stream.point(x2, y2);
            resampleLineTo(x2, y2, lambda2, a, b, c, x1, y1, lambda1, a1, b1, c1, depth, stream);
          }
        }
      }
      return function(stream) {
        var lambda00, x00, y00, a00, b00, c00, // first point
            lambda0, x0, y0, a0, b0, c0; // previous point

        var resampleStream = {
          point: point,
          lineStart: lineStart,
          lineEnd: lineEnd,
          polygonStart: function() { stream.polygonStart(); resampleStream.lineStart = ringStart; },
          polygonEnd: function() { stream.polygonEnd(); resampleStream.lineStart = lineStart; }
        };

        function point(x, y) {
          x = project(x, y);
          stream.point(x[0], x[1]);
        }

        function lineStart() {
          x0 = NaN;
          resampleStream.point = linePoint;
          stream.lineStart();
        }

        function linePoint(lambda, phi) {
          var c = cartesian([lambda, phi]), p = project(lambda, phi);
          resampleLineTo(x0, y0, lambda0, a0, b0, c0, x0 = p[0], y0 = p[1], lambda0 = lambda, a0 = c[0], b0 = c[1], c0 = c[2], maxDepth, stream);
          stream.point(x0, y0);
        }

        function lineEnd() {
          resampleStream.point = point;
          stream.lineEnd();
        }

        function ringStart() {
          lineStart();
          resampleStream.point = ringPoint;
          resampleStream.lineEnd = ringEnd;
        }

        function ringPoint(lambda, phi) {
          linePoint(lambda00 = lambda, phi), x00 = x0, y00 = y0, a00 = a0, b00 = b0, c00 = c0;
          resampleStream.point = linePoint;
        }

        function ringEnd() {
          resampleLineTo(x0, y0, lambda0, a0, b0, c0, x00, y00, lambda00, a00, b00, c00, maxDepth, stream);
          resampleStream.lineEnd = lineEnd;
          lineEnd();
        }

        return resampleStream;
      };
    }

    var transformRadians = transformer$1({
      point: function(x, y) {
        this.stream.point(x * radians, y * radians);
      }
    });

    function transformRotate(rotate) {
      return transformer$1({
        point: function(x, y) {
          var r = rotate(x, y);
          return this.stream.point(r[0], r[1]);
        }
      });
    }

    function scaleTranslate(k, dx, dy, sx, sy) {
      function transform(x, y) {
        x *= sx; y *= sy;
        return [dx + k * x, dy - k * y];
      }
      transform.invert = function(x, y) {
        return [(x - dx) / k * sx, (dy - y) / k * sy];
      };
      return transform;
    }

    function scaleTranslateRotate(k, dx, dy, sx, sy, alpha) {
      if (!alpha) return scaleTranslate(k, dx, dy, sx, sy);
      var cosAlpha = cos(alpha),
          sinAlpha = sin(alpha),
          a = cosAlpha * k,
          b = sinAlpha * k,
          ai = cosAlpha / k,
          bi = sinAlpha / k,
          ci = (sinAlpha * dy - cosAlpha * dx) / k,
          fi = (sinAlpha * dx + cosAlpha * dy) / k;
      function transform(x, y) {
        x *= sx; y *= sy;
        return [a * x - b * y + dx, dy - b * x - a * y];
      }
      transform.invert = function(x, y) {
        return [sx * (ai * x - bi * y + ci), sy * (fi - bi * x - ai * y)];
      };
      return transform;
    }

    function projectionMutator(projectAt) {
      var project,
          k = 150, // scale
          x = 480, y = 250, // translate
          lambda = 0, phi = 0, // center
          deltaLambda = 0, deltaPhi = 0, deltaGamma = 0, rotate, // pre-rotate
          alpha = 0, // post-rotate angle
          sx = 1, // reflectX
          sy = 1, // reflectX
          theta = null, preclip = clipAntimeridian, // pre-clip angle
          x0 = null, y0, x1, y1, postclip = identity$4, // post-clip extent
          delta2 = 0.5, // precision
          projectResample,
          projectTransform,
          projectRotateTransform,
          cache,
          cacheStream;

      function projection(point) {
        return projectRotateTransform(point[0] * radians, point[1] * radians);
      }

      function invert(point) {
        point = projectRotateTransform.invert(point[0], point[1]);
        return point && [point[0] * degrees, point[1] * degrees];
      }

      projection.stream = function(stream) {
        return cache && cacheStream === stream ? cache : cache = transformRadians(transformRotate(rotate)(preclip(projectResample(postclip(cacheStream = stream)))));
      };

      projection.preclip = function(_) {
        return arguments.length ? (preclip = _, theta = undefined, reset()) : preclip;
      };

      projection.postclip = function(_) {
        return arguments.length ? (postclip = _, x0 = y0 = x1 = y1 = null, reset()) : postclip;
      };

      projection.clipAngle = function(_) {
        return arguments.length ? (preclip = +_ ? clipCircle(theta = _ * radians) : (theta = null, clipAntimeridian), reset()) : theta * degrees;
      };

      projection.clipExtent = function(_) {
        return arguments.length ? (postclip = _ == null ? (x0 = y0 = x1 = y1 = null, identity$4) : clipRectangle(x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1]), reset()) : x0 == null ? null : [[x0, y0], [x1, y1]];
      };

      projection.scale = function(_) {
        return arguments.length ? (k = +_, recenter()) : k;
      };

      projection.translate = function(_) {
        return arguments.length ? (x = +_[0], y = +_[1], recenter()) : [x, y];
      };

      projection.center = function(_) {
        return arguments.length ? (lambda = _[0] % 360 * radians, phi = _[1] % 360 * radians, recenter()) : [lambda * degrees, phi * degrees];
      };

      projection.rotate = function(_) {
        return arguments.length ? (deltaLambda = _[0] % 360 * radians, deltaPhi = _[1] % 360 * radians, deltaGamma = _.length > 2 ? _[2] % 360 * radians : 0, recenter()) : [deltaLambda * degrees, deltaPhi * degrees, deltaGamma * degrees];
      };

      projection.angle = function(_) {
        return arguments.length ? (alpha = _ % 360 * radians, recenter()) : alpha * degrees;
      };

      projection.reflectX = function(_) {
        return arguments.length ? (sx = _ ? -1 : 1, recenter()) : sx < 0;
      };

      projection.reflectY = function(_) {
        return arguments.length ? (sy = _ ? -1 : 1, recenter()) : sy < 0;
      };

      projection.precision = function(_) {
        return arguments.length ? (projectResample = resample(projectTransform, delta2 = _ * _), reset()) : sqrt$1(delta2);
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

      function recenter() {
        var center = scaleTranslateRotate(k, 0, 0, sx, sy, alpha).apply(null, project(lambda, phi)),
            transform = scaleTranslateRotate(k, x - center[0], y - center[1], sx, sy, alpha);
        rotate = rotateRadians(deltaLambda, deltaPhi, deltaGamma);
        projectTransform = compose(project, transform);
        projectRotateTransform = compose(rotate, projectTransform);
        projectResample = resample(projectTransform, delta2);
        return reset();
      }

      function reset() {
        cache = cacheStream = null;
        return projection;
      }

      return function() {
        project = projectAt.apply(this, arguments);
        projection.invert = project.invert && invert;
        return recenter();
      };
    }

    function conicProjection(projectAt) {
      var phi0 = 0,
          phi1 = pi / 3,
          m = projectionMutator(projectAt),
          p = m(phi0, phi1);

      p.parallels = function(_) {
        return arguments.length ? m(phi0 = _[0] * radians, phi1 = _[1] * radians) : [phi0 * degrees, phi1 * degrees];
      };

      return p;
    }

    function cylindricalEqualAreaRaw(phi0) {
      var cosPhi0 = cos(phi0);

      function forward(lambda, phi) {
        return [lambda * cosPhi0, sin(phi) / cosPhi0];
      }

      forward.invert = function(x, y) {
        return [x / cosPhi0, asin(y * cosPhi0)];
      };

      return forward;
    }

    function conicEqualAreaRaw(y0, y1) {
      var sy0 = sin(y0), n = (sy0 + sin(y1)) / 2;

      // Are the parallels symmetrical around the Equator?
      if (abs(n) < epsilon) return cylindricalEqualAreaRaw(y0);

      var c = 1 + sy0 * (2 * n - sy0), r0 = sqrt$1(c) / n;

      function project(x, y) {
        var r = sqrt$1(c - 2 * n * sin(y)) / n;
        return [r * sin(x *= n), r0 - r * cos(x)];
      }

      project.invert = function(x, y) {
        var r0y = r0 - y,
            l = atan2(x, abs(r0y)) * sign(r0y);
        if (r0y * n < 0)
          l -= pi * sign(x) * sign(r0y);
        return [l / n, asin((c - (x * x + r0y * r0y) * n * n) / (2 * n))];
      };

      return project;
    }

    function conicEqualArea() {
      return conicProjection(conicEqualAreaRaw)
          .scale(155.424)
          .center([0, 33.6442]);
    }

    function albers() {
      return conicEqualArea()
          .parallels([29.5, 45.5])
          .scale(1070)
          .translate([480, 250])
          .rotate([96, 0])
          .center([-0.6, 38.7]);
    }

    // The projections must have mutually exclusive clip regions on the sphere,
    // as this will avoid emitting interleaving lines and polygons.
    function multiplex(streams) {
      var n = streams.length;
      return {
        point: function(x, y) { var i = -1; while (++i < n) streams[i].point(x, y); },
        sphere: function() { var i = -1; while (++i < n) streams[i].sphere(); },
        lineStart: function() { var i = -1; while (++i < n) streams[i].lineStart(); },
        lineEnd: function() { var i = -1; while (++i < n) streams[i].lineEnd(); },
        polygonStart: function() { var i = -1; while (++i < n) streams[i].polygonStart(); },
        polygonEnd: function() { var i = -1; while (++i < n) streams[i].polygonEnd(); }
      };
    }

    // A composite projection for the United States, configured by default for
    // 960×500. The projection also works quite well at 960×600 if you change the
    // scale to 1285 and adjust the translate accordingly. The set of standard
    // parallels for each region comes from USGS, which is published here:
    // http://egsc.usgs.gov/isb/pubs/MapProjections/projections.html#albers
    function geoAlbersUsa() {
      var cache,
          cacheStream,
          lower48 = albers(), lower48Point,
          alaska = conicEqualArea().rotate([154, 0]).center([-2, 58.5]).parallels([55, 65]), alaskaPoint, // EPSG:3338
          hawaii = conicEqualArea().rotate([157, 0]).center([-3, 19.9]).parallels([8, 18]), hawaiiPoint, // ESRI:102007
          point, pointStream = {point: function(x, y) { point = [x, y]; }};

      function albersUsa(coordinates) {
        var x = coordinates[0], y = coordinates[1];
        return point = null,
            (lower48Point.point(x, y), point)
            || (alaskaPoint.point(x, y), point)
            || (hawaiiPoint.point(x, y), point);
      }

      albersUsa.invert = function(coordinates) {
        var k = lower48.scale(),
            t = lower48.translate(),
            x = (coordinates[0] - t[0]) / k,
            y = (coordinates[1] - t[1]) / k;
        return (y >= 0.120 && y < 0.234 && x >= -0.425 && x < -0.214 ? alaska
            : y >= 0.166 && y < 0.234 && x >= -0.214 && x < -0.115 ? hawaii
            : lower48).invert(coordinates);
      };

      albersUsa.stream = function(stream) {
        return cache && cacheStream === stream ? cache : cache = multiplex([lower48.stream(cacheStream = stream), alaska.stream(stream), hawaii.stream(stream)]);
      };

      albersUsa.precision = function(_) {
        if (!arguments.length) return lower48.precision();
        lower48.precision(_), alaska.precision(_), hawaii.precision(_);
        return reset();
      };

      albersUsa.scale = function(_) {
        if (!arguments.length) return lower48.scale();
        lower48.scale(_), alaska.scale(_ * 0.35), hawaii.scale(_);
        return albersUsa.translate(lower48.translate());
      };

      albersUsa.translate = function(_) {
        if (!arguments.length) return lower48.translate();
        var k = lower48.scale(), x = +_[0], y = +_[1];

        lower48Point = lower48
            .translate(_)
            .clipExtent([[x - 0.455 * k, y - 0.238 * k], [x + 0.455 * k, y + 0.238 * k]])
            .stream(pointStream);

        alaskaPoint = alaska
            .translate([x - 0.307 * k, y + 0.201 * k])
            .clipExtent([[x - 0.425 * k + epsilon, y + 0.120 * k + epsilon], [x - 0.214 * k - epsilon, y + 0.234 * k - epsilon]])
            .stream(pointStream);

        hawaiiPoint = hawaii
            .translate([x - 0.205 * k, y + 0.212 * k])
            .clipExtent([[x - 0.214 * k + epsilon, y + 0.166 * k + epsilon], [x - 0.115 * k - epsilon, y + 0.234 * k - epsilon]])
            .stream(pointStream);

        return reset();
      };

      albersUsa.fitExtent = function(extent, object) {
        return fitExtent(albersUsa, extent, object);
      };

      albersUsa.fitSize = function(size, object) {
        return fitSize(albersUsa, size, object);
      };

      albersUsa.fitWidth = function(width, object) {
        return fitWidth(albersUsa, width, object);
      };

      albersUsa.fitHeight = function(height, object) {
        return fitHeight(albersUsa, height, object);
      };

      function reset() {
        cache = cacheStream = null;
        return albersUsa;
      }

      return albersUsa.scale(1070);
    }

    /* src/components/Map.svg.svelte generated by Svelte v3.32.2 */
    const file$6 = "src/components/Map.svg.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	return child_ctx;
    }

    // (58:1) {#each features as feature}
    function create_each_block$1(ctx) {
    	let path;
    	let path_fill_value;
    	let path_d_value;
    	let mounted;
    	let dispose;

    	function mouseover_handler(...args) {
    		return /*mouseover_handler*/ ctx[19](/*feature*/ ctx[21], ...args);
    	}

    	const block = {
    		c: function create() {
    			path = svg_element("path");
    			attr_dev(path, "class", "feature-path svelte-u3wqx1");
    			attr_dev(path, "fill", path_fill_value = /*fill*/ ctx[0] || /*$zGet*/ ctx[5](/*feature*/ ctx[21].properties));
    			attr_dev(path, "stroke", /*stroke*/ ctx[1]);
    			attr_dev(path, "stroke-width", /*strokeWidth*/ ctx[2]);
    			attr_dev(path, "d", path_d_value = /*geoPathFn*/ ctx[4](/*feature*/ ctx[21]));
    			add_location(path, file$6, 58, 2, 1668);
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
    							if (is_function(/*handleMousemove*/ ctx[11](/*feature*/ ctx[21]))) /*handleMousemove*/ ctx[11](/*feature*/ ctx[21]).apply(this, arguments);
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

    			if (dirty & /*fill, $zGet, features*/ 41 && path_fill_value !== (path_fill_value = /*fill*/ ctx[0] || /*$zGet*/ ctx[5](/*feature*/ ctx[21].properties))) {
    				attr_dev(path, "fill", path_fill_value);
    			}

    			if (dirty & /*stroke*/ 2) {
    				attr_dev(path, "stroke", /*stroke*/ ctx[1]);
    			}

    			if (dirty & /*strokeWidth*/ 4) {
    				attr_dev(path, "stroke-width", /*strokeWidth*/ ctx[2]);
    			}

    			if (dirty & /*geoPathFn, features*/ 24 && path_d_value !== (path_d_value = /*geoPathFn*/ ctx[4](/*feature*/ ctx[21]))) {
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
    		source: "(58:1) {#each features as feature}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
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
    			add_location(g, file$6, 53, 0, 1570);
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
    				dispose = listen_dev(g, "mouseout", /*mouseout_handler*/ ctx[20], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*fill, $zGet, features, stroke, strokeWidth, geoPathFn, dispatch, handleMousemove*/ 3135) {
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let fitSizeRange;
    	let projectionFn;
    	let geoPathFn;
    	let $data;
    	let $width;
    	let $height;
    	let $zGet;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Map_svg", slots, []);
    	const { data, width, height, zGet } = getContext("LayerCake");
    	validate_store(data, "data");
    	component_subscribe($$self, data, value => $$invalidate(14, $data = value));
    	validate_store(width, "width");
    	component_subscribe($$self, width, value => $$invalidate(16, $width = value));
    	validate_store(height, "height");
    	component_subscribe($$self, height, value => $$invalidate(17, $height = value));
    	validate_store(zGet, "zGet");
    	component_subscribe($$self, zGet, value => $$invalidate(5, $zGet = value));
    	let { projection } = $$props;
    	let { fixedAspectRatio = undefined } = $$props;
    	let { fill = undefined } = $$props; // The fill will be determined by the scale, unless this prop is set
    	let { stroke = "#333" } = $$props;
    	let { strokeWidth = 0.5 } = $$props;
    	let { features = $data.features } = $$props;

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

    	const writable_props = ["projection", "fixedAspectRatio", "fill", "stroke", "strokeWidth", "features"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Map_svg> was created with unknown prop '${key}'`);
    	});

    	const mouseover_handler = (feature, e) => dispatch("mousemove", { e, props: feature.properties });
    	const mouseout_handler = e => dispatch("mouseout");

    	$$self.$$set = $$props => {
    		if ("projection" in $$props) $$invalidate(12, projection = $$props.projection);
    		if ("fixedAspectRatio" in $$props) $$invalidate(13, fixedAspectRatio = $$props.fixedAspectRatio);
    		if ("fill" in $$props) $$invalidate(0, fill = $$props.fill);
    		if ("stroke" in $$props) $$invalidate(1, stroke = $$props.stroke);
    		if ("strokeWidth" in $$props) $$invalidate(2, strokeWidth = $$props.strokeWidth);
    		if ("features" in $$props) $$invalidate(3, features = $$props.features);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		createEventDispatcher,
    		geoPath,
    		raise,
    		data,
    		width,
    		height,
    		zGet,
    		projection,
    		fixedAspectRatio,
    		fill,
    		stroke,
    		strokeWidth,
    		features,
    		dispatch,
    		handleMousemove,
    		$data,
    		fitSizeRange,
    		$width,
    		$height,
    		projectionFn,
    		geoPathFn,
    		$zGet
    	});

    	$$self.$inject_state = $$props => {
    		if ("projection" in $$props) $$invalidate(12, projection = $$props.projection);
    		if ("fixedAspectRatio" in $$props) $$invalidate(13, fixedAspectRatio = $$props.fixedAspectRatio);
    		if ("fill" in $$props) $$invalidate(0, fill = $$props.fill);
    		if ("stroke" in $$props) $$invalidate(1, stroke = $$props.stroke);
    		if ("strokeWidth" in $$props) $$invalidate(2, strokeWidth = $$props.strokeWidth);
    		if ("features" in $$props) $$invalidate(3, features = $$props.features);
    		if ("fitSizeRange" in $$props) $$invalidate(15, fitSizeRange = $$props.fitSizeRange);
    		if ("projectionFn" in $$props) $$invalidate(18, projectionFn = $$props.projectionFn);
    		if ("geoPathFn" in $$props) $$invalidate(4, geoPathFn = $$props.geoPathFn);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*fixedAspectRatio, $width, $height*/ 204800) {
    			$$invalidate(15, fitSizeRange = fixedAspectRatio
    			? [100, 100 / fixedAspectRatio]
    			: [$width, $height]);
    		}

    		if ($$self.$$.dirty & /*projection, fitSizeRange, $data*/ 53248) {
    			$$invalidate(18, projectionFn = projection().fitSize(fitSizeRange, $data));
    		}

    		if ($$self.$$.dirty & /*projectionFn*/ 262144) {
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
    		projection,
    		fixedAspectRatio,
    		$data,
    		fitSizeRange,
    		$width,
    		$height,
    		projectionFn,
    		mouseover_handler,
    		mouseout_handler
    	];
    }

    class Map_svg extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			projection: 12,
    			fixedAspectRatio: 13,
    			fill: 0,
    			stroke: 1,
    			strokeWidth: 2,
    			features: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Map_svg",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*projection*/ ctx[12] === undefined && !("projection" in props)) {
    			console.warn("<Map_svg> was created without expected prop 'projection'");
    		}
    	}

    	get projection() {
    		throw new Error("<Map_svg>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set projection(value) {
    		throw new Error("<Map_svg>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fixedAspectRatio() {
    		throw new Error("<Map_svg>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fixedAspectRatio(value) {
    		throw new Error("<Map_svg>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fill() {
    		throw new Error("<Map_svg>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fill(value) {
    		throw new Error("<Map_svg>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get stroke() {
    		throw new Error("<Map_svg>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set stroke(value) {
    		throw new Error("<Map_svg>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get strokeWidth() {
    		throw new Error("<Map_svg>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set strokeWidth(value) {
    		throw new Error("<Map_svg>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get features() {
    		throw new Error("<Map_svg>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set features(value) {
    		throw new Error("<Map_svg>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var type = "Topology";
    var objects = {
    	collection: {
    		type: "GeometryCollection",
    		geometries: [
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "Alabama",
    					FOO: 5045
    				},
    				arcs: [
    					[
    						0,
    						1,
    						2,
    						3,
    						4
    					]
    				]
    			},
    			{
    				type: "MultiPolygon",
    				properties: {
    					NAME: "Alaska",
    					FOO: 57064
    				},
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
    							8
    						]
    					],
    					[
    						[
    							9
    						]
    					],
    					[
    						[
    							10
    						]
    					],
    					[
    						[
    							11
    						]
    					],
    					[
    						[
    							12
    						]
    					],
    					[
    						[
    							13
    						]
    					],
    					[
    						[
    							14
    						]
    					],
    					[
    						[
    							15
    						]
    					],
    					[
    						[
    							16
    						]
    					],
    					[
    						[
    							17
    						]
    					],
    					[
    						[
    							18
    						]
    					],
    					[
    						[
    							19
    						]
    					],
    					[
    						[
    							20
    						]
    					],
    					[
    						[
    							21
    						]
    					],
    					[
    						[
    							22
    						]
    					],
    					[
    						[
    							23
    						]
    					],
    					[
    						[
    							24
    						]
    					],
    					[
    						[
    							25
    						]
    					],
    					[
    						[
    							26
    						]
    					],
    					[
    						[
    							27
    						]
    					],
    					[
    						[
    							28
    						]
    					],
    					[
    						[
    							29
    						]
    					],
    					[
    						[
    							30
    						]
    					],
    					[
    						[
    							31
    						]
    					],
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
    							34
    						]
    					],
    					[
    						[
    							35
    						]
    					],
    					[
    						[
    							36
    						]
    					],
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
    							42
    						]
    					],
    					[
    						[
    							43
    						]
    					],
    					[
    						[
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
    							46
    						]
    					],
    					[
    						[
    							47
    						]
    					],
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
    							50
    						]
    					],
    					[
    						[
    							51
    						]
    					],
    					[
    						[
    							52
    						]
    					],
    					[
    						[
    							53
    						]
    					],
    					[
    						[
    							54
    						]
    					],
    					[
    						[
    							55
    						]
    					],
    					[
    						[
    							56
    						]
    					],
    					[
    						[
    							57
    						]
    					],
    					[
    						[
    							58
    						]
    					],
    					[
    						[
    							59
    						]
    					],
    					[
    						[
    							60
    						]
    					],
    					[
    						[
    							61
    						]
    					],
    					[
    						[
    							62
    						]
    					],
    					[
    						[
    							63
    						]
    					],
    					[
    						[
    							64
    						]
    					],
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
    							68
    						]
    					],
    					[
    						[
    							69
    						]
    					],
    					[
    						[
    							70
    						]
    					],
    					[
    						[
    							71
    						]
    					],
    					[
    						[
    							72
    						]
    					],
    					[
    						[
    							73
    						]
    					],
    					[
    						[
    							74
    						]
    					],
    					[
    						[
    							75
    						]
    					],
    					[
    						[
    							76
    						]
    					],
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
    							83
    						]
    					],
    					[
    						[
    							84
    						]
    					],
    					[
    						[
    							85
    						]
    					],
    					[
    						[
    							86
    						]
    					],
    					[
    						[
    							87
    						]
    					],
    					[
    						[
    							88
    						]
    					],
    					[
    						[
    							89
    						]
    					],
    					[
    						[
    							90
    						]
    					],
    					[
    						[
    							91
    						]
    					],
    					[
    						[
    							92
    						]
    					],
    					[
    						[
    							93
    						]
    					],
    					[
    						[
    							94
    						]
    					],
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
    							97
    						]
    					],
    					[
    						[
    							98
    						]
    					],
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
    							105
    						]
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "Arizona",
    					FOO: 1135
    				},
    				arcs: [
    					[
    						106,
    						107,
    						108,
    						109,
    						110
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "Arkansas",
    					FOO: 52035
    				},
    				arcs: [
    					[
    						111,
    						112,
    						113,
    						114,
    						115,
    						116,
    						117,
    						118,
    						119,
    						120
    					]
    				]
    			},
    			{
    				type: "MultiPolygon",
    				properties: {
    					NAME: "California",
    					FOO: 655779
    				},
    				arcs: [
    					[
    						[
    							121
    						]
    					],
    					[
    						[
    							122
    						]
    					],
    					[
    						[
    							123
    						]
    					],
    					[
    						[
    							124
    						]
    					],
    					[
    						[
    							125
    						]
    					],
    					[
    						[
    							126
    						]
    					],
    					[
    						[
    							127,
    							-109,
    							128,
    							129
    						]
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "Colorado",
    					FOO: 10641
    				},
    				arcs: [
    					[
    						130,
    						131,
    						132,
    						133,
    						134,
    						135
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "Connecticut",
    					FOO: 48422
    				},
    				arcs: [
    					[
    						136,
    						137,
    						138,
    						139
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "Delaware",
    					FOO: 19459
    				},
    				arcs: [
    					[
    						140,
    						141,
    						142,
    						143
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "District of Columbia",
    					FOO: 612
    				},
    				arcs: [
    					[
    						144,
    						145
    					]
    				]
    			},
    			{
    				type: "MultiPolygon",
    				properties: {
    					NAME: "Florida",
    					FOO: 5624
    				},
    				arcs: [
    					[
    						[
    							146
    						]
    					],
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
    							152,
    							-2,
    							153
    						]
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "Georgia",
    					FOO: 17513
    				},
    				arcs: [
    					[
    						154,
    						155,
    						156,
    						-154,
    						-1,
    						157
    					]
    				]
    			},
    			{
    				type: "MultiPolygon",
    				properties: {
    					NAME: "Hawaii",
    					FOO: 64222
    				},
    				arcs: [
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
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "Idaho",
    					FOO: 82643.117
    				},
    				arcs: [
    					[
    						166,
    						167,
    						168,
    						169,
    						170,
    						171,
    						172
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "Illinois",
    					FOO: 255518
    				},
    				arcs: [
    					[
    						173,
    						174,
    						175,
    						176,
    						177,
    						178
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "Indiana",
    					FOO: 135826
    				},
    				arcs: [
    					[
    						179,
    						-175,
    						180,
    						181,
    						182
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "Iowa",
    					FOO: 55857.13
    				},
    				arcs: [
    					[
    						183,
    						-178,
    						184,
    						185,
    						186,
    						187
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "Kansas",
    					FOO: 381758.717
    				},
    				arcs: [
    					[
    						-132,
    						188,
    						189,
    						190
    					]
    				]
    			},
    			{
    				type: "MultiPolygon",
    				properties: {
    					NAME: "Kentucky",
    					FOO: 93986
    				},
    				arcs: [
    					[
    						[
    							191,
    							192
    						]
    					],
    					[
    						[
    							193,
    							194,
    							195,
    							-176,
    							-180,
    							196,
    							197
    						]
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "Louisiana",
    					FOO: 432033
    				},
    				arcs: [
    					[
    						198,
    						-121,
    						199,
    						200
    					]
    				]
    			},
    			{
    				type: "MultiPolygon",
    				properties: {
    					NAME: "Maine",
    					FOO: 60842
    				},
    				arcs: [
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
    					],
    					[
    						[
    							208,
    							209
    						]
    					]
    				]
    			},
    			{
    				type: "MultiPolygon",
    				properties: {
    					NAME: "Maryland",
    					FOO: 9757
    				},
    				arcs: [
    					[
    						[
    							210
    						]
    					],
    					[
    						[
    							211,
    							212
    						]
    					],
    					[
    						[
    							-146,
    							213,
    							214,
    							215,
    							-143,
    							216,
    							217,
    							218,
    							219
    						]
    					]
    				]
    			},
    			{
    				type: "MultiPolygon",
    				properties: {
    					NAME: "Massachusetts",
    					FOO: 78001
    				},
    				arcs: [
    					[
    						[
    							220
    						]
    					],
    					[
    						[
    							221
    						]
    					],
    					[
    						[
    							222,
    							223,
    							224,
    							225,
    							226,
    							-140,
    							227,
    							228
    						]
    					]
    				]
    			},
    			{
    				type: "MultiPolygon",
    				properties: {
    					NAME: "Michigan",
    					FOO: 256538.901
    				},
    				arcs: [
    					[
    						[
    							229
    						]
    					],
    					[
    						[
    							230
    						]
    					],
    					[
    						[
    							231
    						]
    					],
    					[
    						[
    							232
    						]
    					],
    					[
    						[
    							233
    						]
    					],
    					[
    						[
    							234
    						]
    					],
    					[
    						[
    							235
    						]
    					],
    					[
    						[
    							-182,
    							236,
    							237
    						]
    					],
    					[
    						[
    							238,
    							239
    						]
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "Minnesota",
    					FOO: 188626
    				},
    				arcs: [
    					[
    						-188,
    						240,
    						241,
    						242,
    						243
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "Mississippi",
    					FOO: 126923
    				},
    				arcs: [
    					[
    						244,
    						-4,
    						245,
    						-200,
    						-120,
    						-119,
    						-118,
    						-117,
    						-116
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "Missouri",
    					FOO: 68741.522
    				},
    				arcs: [
    					[
    						-114,
    						246,
    						-190,
    						247,
    						-185,
    						-177,
    						-196,
    						248,
    						-193,
    						249
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "Montana",
    					FOO: 145545.801
    				},
    				arcs: [
    					[
    						-172,
    						250,
    						251,
    						252,
    						253
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "Nebraska",
    					FOO: 76824.171
    				},
    				arcs: [
    					[
    						254,
    						255,
    						-186,
    						-248,
    						-189,
    						-131
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "Nevada",
    					FOO: 109781.18
    				},
    				arcs: [
    					[
    						-110,
    						-128,
    						256,
    						-168,
    						257
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "New Hampshire",
    					FOO: 2952
    				},
    				arcs: [
    					[
    						258,
    						-209,
    						259,
    						-223,
    						260
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "New Jersey",
    					FOO: 17354
    				},
    				arcs: [
    					[
    						261,
    						262,
    						263,
    						264,
    						-141,
    						265
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "New Mexico",
    					FOO: 555779
    				},
    				arcs: [
    					[
    						266,
    						-107,
    						-134,
    						267,
    						268
    					]
    				]
    			},
    			{
    				type: "MultiPolygon",
    				properties: {
    					NAME: "New York",
    					FOO: 47126.399
    				},
    				arcs: [
    					[
    						[
    							269,
    							270
    						]
    					],
    					[
    						[
    							271
    						]
    					],
    					[
    						[
    							272,
    							-228,
    							-139,
    							273,
    							-262,
    							274,
    							275
    						]
    					]
    				]
    			},
    			{
    				type: "MultiPolygon",
    				properties: {
    					NAME: "North Carolina",
    					FOO: 148617
    				},
    				arcs: [
    					[
    						[
    							276
    						]
    					],
    					[
    						[
    							277
    						]
    					],
    					[
    						[
    							278,
    							279,
    							-155,
    							280,
    							281
    						]
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "North Dakota",
    					FOO: 16900
    				},
    				arcs: [
    					[
    						-252,
    						282,
    						-242,
    						283
    					]
    				]
    			},
    			{
    				type: "MultiPolygon",
    				properties: {
    					NAME: "Ohio",
    					FOO: 40860.694
    				},
    				arcs: [
    					[
    						[
    							284
    						]
    					],
    					[
    						[
    							-197,
    							-183,
    							-238,
    							285,
    							286,
    							287
    						]
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "Oklahoma",
    					FOO: 168594
    				},
    				arcs: [
    					[
    						-268,
    						-133,
    						-191,
    						-247,
    						-113,
    						288
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "Oregon",
    					FOO: 9588
    				},
    				arcs: [
    					[
    						-169,
    						-257,
    						-130,
    						289,
    						290
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "Pennsylvania",
    					FOO: 447442
    				},
    				arcs: [
    					[
    						-287,
    						291,
    						-275,
    						-266,
    						-144,
    						-216,
    						292
    					]
    				]
    			},
    			{
    				type: "MultiPolygon",
    				properties: {
    					NAME: "Rhode Island",
    					FOO: 555779
    				},
    				arcs: [
    					[
    						[
    							293,
    							-225
    						]
    					],
    					[
    						[
    							294
    						]
    					],
    					[
    						[
    							-227,
    							295,
    							-137
    						]
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "South Carolina",
    					FOO: 825060
    				},
    				arcs: [
    					[
    						-156,
    						-280,
    						296
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "South Dakota",
    					FOO: 795811
    				},
    				arcs: [
    					[
    						-253,
    						-284,
    						-241,
    						-187,
    						-256,
    						297
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "Tennessee",
    					FOO: 341234
    				},
    				arcs: [
    					[
    						-281,
    						-158,
    						-5,
    						-245,
    						-115,
    						-250,
    						-192,
    						-249,
    						-195,
    						298
    					]
    				]
    			},
    			{
    				type: "MultiPolygon",
    				properties: {
    					NAME: "Texas",
    					FOO: 861231
    				},
    				arcs: [
    					[
    						[
    							299
    						]
    					],
    					[
    						[
    							-269,
    							-289,
    							-112,
    							-199,
    							300
    						]
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "Utah",
    					FOO: 289169
    				},
    				arcs: [
    					[
    						-135,
    						-111,
    						-258,
    						-167,
    						301
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "Vermont",
    					FOO: 759216
    				},
    				arcs: [
    					[
    						-229,
    						-273,
    						302,
    						-261
    					]
    				]
    			},
    			{
    				type: "MultiPolygon",
    				properties: {
    					NAME: "Virginia",
    					FOO: 139490
    				},
    				arcs: [
    					[
    						[
    							303,
    							-213
    						]
    					],
    					[
    						[
    							304,
    							-218
    						]
    					],
    					[
    						[
    							305,
    							-282,
    							-299,
    							-194,
    							306,
    							-214,
    							-145,
    							-220
    						]
    					]
    				]
    			},
    			{
    				type: "MultiPolygon",
    				properties: {
    					NAME: "Washington",
    					FOO: 966455
    				},
    				arcs: [
    					[
    						[
    							307
    						]
    					],
    					[
    						[
    							308
    						]
    					],
    					[
    						[
    							309
    						]
    					],
    					[
    						[
    							310
    						]
    					],
    					[
    						[
    							311
    						]
    					],
    					[
    						[
    							-170,
    							-291,
    							312
    						]
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "West Virginia",
    					FOO: 24038.21
    				},
    				arcs: [
    					[
    						-215,
    						-307,
    						-198,
    						-288,
    						-293
    					]
    				]
    			},
    			{
    				type: "MultiPolygon",
    				properties: {
    					NAME: "Wisconsin",
    					FOO: 154157
    				},
    				arcs: [
    					[
    						[
    							313
    						]
    					],
    					[
    						[
    							314
    						]
    					],
    					[
    						[
    							315
    						]
    					],
    					[
    						[
    							316
    						]
    					],
    					[
    						[
    							317
    						]
    					],
    					[
    						[
    							-179,
    							-184,
    							-244,
    							318,
    							-240,
    							319
    						]
    					],
    					[
    						[
    							320
    						]
    					]
    				]
    			},
    			{
    				type: "Polygon",
    				properties: {
    					NAME: "Wyoming",
    					FOO: 297093.141
    				},
    				arcs: [
    					[
    						-173,
    						-254,
    						-298,
    						-255,
    						-136,
    						-302
    					]
    				]
    			},
    			{
    				type: "MultiPolygon",
    				properties: {
    					NAME: "Puerto Rico",
    					FOO: 3423.775
    				},
    				arcs: [
    					[
    						[
    							321
    						]
    					],
    					[
    						[
    							322
    						]
    					],
    					[
    						[
    							323
    						]
    					],
    					[
    						[
    							324
    						]
    					]
    				]
    			}
    		]
    	}
    };
    var arcs = [
    	[
    		[
    			2606,
    			3192
    		],
    		[
    			1,
    			-44
    		],
    		[
    			3,
    			-79
    		],
    		[
    			3,
    			-108
    		],
    		[
    			1,
    			-50
    		],
    		[
    			2,
    			-66
    		],
    		[
    			2,
    			-49
    		],
    		[
    			0,
    			-5
    		],
    		[
    			0,
    			-5
    		],
    		[
    			1,
    			-7
    		],
    		[
    			1,
    			-18
    		],
    		[
    			1,
    			-19
    		],
    		[
    			2,
    			-12
    		],
    		[
    			0,
    			-12
    		],
    		[
    			1,
    			-2
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			0,
    			-6
    		],
    		[
    			0,
    			-4
    		],
    		[
    			2,
    			-5
    		],
    		[
    			1,
    			-6
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-2,
    			-10
    		],
    		[
    			0,
    			-9
    		],
    		[
    			0,
    			-13
    		],
    		[
    			-1,
    			-16
    		],
    		[
    			-1,
    			-13
    		],
    		[
    			0,
    			-8
    		],
    		[
    			0,
    			-6
    		],
    		[
    			0,
    			-9
    		],
    		[
    			0,
    			-8
    		],
    		[
    			2,
    			-14
    		],
    		[
    			0,
    			-9
    		],
    		[
    			1,
    			-5
    		],
    		[
    			-1,
    			-14
    		],
    		[
    			-1,
    			-19
    		],
    		[
    			0,
    			-13
    		],
    		[
    			0,
    			-6
    		],
    		[
    			0,
    			-7
    		],
    		[
    			0,
    			-12
    		],
    		[
    			1,
    			-1
    		],
    		[
    			1,
    			-9
    		],
    		[
    			0,
    			-11
    		],
    		[
    			1,
    			-10
    		]
    	],
    	[
    		[
    			2623,
    			2446
    		],
    		[
    			-7,
    			1
    		],
    		[
    			-7,
    			-1
    		],
    		[
    			-11,
    			-1
    		],
    		[
    			-6,
    			0
    		],
    		[
    			-12,
    			0
    		],
    		[
    			-5,
    			1
    		],
    		[
    			-12,
    			0
    		],
    		[
    			-13,
    			0
    		],
    		[
    			1,
    			-6
    		],
    		[
    			-2,
    			-19
    		],
    		[
    			1,
    			-8
    		],
    		[
    			2,
    			-7
    		],
    		[
    			0,
    			-8
    		],
    		[
    			1,
    			-4
    		],
    		[
    			3,
    			-8
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-1,
    			-13
    		],
    		[
    			0,
    			-6
    		],
    		[
    			0,
    			-9
    		],
    		[
    			2,
    			-9
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-1,
    			-13
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			0,
    			-8
    		]
    	],
    	[
    		[
    			2553,
    			2312
    		],
    		[
    			-4,
    			-6
    		],
    		[
    			-5,
    			-4
    		],
    		[
    			-4,
    			1
    		],
    		[
    			1,
    			5
    		],
    		[
    			1,
    			-4
    		],
    		[
    			1,
    			0
    		],
    		[
    			3,
    			4
    		],
    		[
    			0,
    			6
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-1,
    			14
    		],
    		[
    			1,
    			12
    		],
    		[
    			0,
    			12
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			1,
    			-6
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			0,
    			-25
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			-1,
    			0
    		],
    		[
    			0,
    			8
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			0,
    			4
    		],
    		[
    			-2,
    			-4
    		]
    	],
    	[
    		[
    			2528,
    			2328
    		],
    		[
    			0,
    			93
    		],
    		[
    			-1,
    			72
    		],
    		[
    			-1,
    			84
    		],
    		[
    			0,
    			37
    		],
    		[
    			2,
    			104
    		],
    		[
    			1,
    			49
    		],
    		[
    			1,
    			67
    		],
    		[
    			1,
    			83
    		],
    		[
    			1,
    			38
    		],
    		[
    			1,
    			58
    		],
    		[
    			2,
    			111
    		],
    		[
    			1,
    			51
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-1,
    			13
    		]
    	],
    	[
    		[
    			2534,
    			3194
    		],
    		[
    			0,
    			3
    		],
    		[
    			15,
    			-1
    		],
    		[
    			6,
    			0
    		],
    		[
    			16,
    			-2
    		],
    		[
    			15,
    			-1
    		],
    		[
    			14,
    			0
    		],
    		[
    			6,
    			-1
    		]
    	],
    	[
    		[
    			363,
    			6749
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-2,
    			1
    		],
    		[
    			0,
    			7
    		],
    		[
    			2,
    			-2
    		]
    	],
    	[
    		[
    			496,
    			6979
    		],
    		[
    			0,
    			-11
    		],
    		[
    			-3,
    			8
    		],
    		[
    			1,
    			4
    		],
    		[
    			2,
    			-1
    		]
    	],
    	[
    		[
    			487,
    			6984
    		],
    		[
    			4,
    			1
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-4,
    			-1
    		],
    		[
    			1,
    			8
    		]
    	],
    	[
    		[
    			547,
    			6899
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-1,
    			11
    		],
    		[
    			1,
    			2
    		],
    		[
    			2,
    			-7
    		]
    	],
    	[
    		[
    			471,
    			6934
    		],
    		[
    			0,
    			-3
    		],
    		[
    			0,
    			-13
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-2,
    			9
    		],
    		[
    			0,
    			8
    		],
    		[
    			3,
    			11
    		],
    		[
    			2,
    			-2
    		]
    	],
    	[
    		[
    			552,
    			6925
    		],
    		[
    			2,
    			4
    		],
    		[
    			2,
    			-4
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-1,
    			4
    		],
    		[
    			0,
    			8
    		]
    	],
    	[
    		[
    			533,
    			6968
    		],
    		[
    			-1,
    			8
    		],
    		[
    			3,
    			-2
    		],
    		[
    			2,
    			18
    		],
    		[
    			1,
    			-4
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			0,
    			-10
    		],
    		[
    			3,
    			3
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-2,
    			2
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-3,
    			-12
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-2,
    			-13
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-2,
    			4
    		],
    		[
    			1,
    			8
    		],
    		[
    			3,
    			14
    		],
    		[
    			1,
    			4
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-1,
    			13
    		],
    		[
    			2,
    			7
    		],
    		[
    			2,
    			-5
    		],
    		[
    			1,
    			5
    		]
    	],
    	[
    		[
    			549,
    			6950
    		],
    		[
    			2,
    			0
    		],
    		[
    			1,
    			-3
    		],
    		[
    			0,
    			-13
    		],
    		[
    			-3,
    			-6
    		],
    		[
    			0,
    			6
    		],
    		[
    			1,
    			4
    		],
    		[
    			-1,
    			7
    		],
    		[
    			0,
    			5
    		]
    	],
    	[
    		[
    			546,
    			6973
    		],
    		[
    			1,
    			-2
    		],
    		[
    			0,
    			-7
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-1,
    			6
    		],
    		[
    			1,
    			9
    		],
    		[
    			1,
    			8
    		],
    		[
    			2,
    			18
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-1,
    			-9
    		]
    	],
    	[
    		[
    			486,
    			6967
    		],
    		[
    			1,
    			-9
    		],
    		[
    			-2,
    			-10
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-3,
    			19
    		],
    		[
    			1,
    			4
    		],
    		[
    			4,
    			-5
    		]
    	],
    	[
    		[
    			519,
    			7000
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			2,
    			-9
    		],
    		[
    			1,
    			-11
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			-4,
    			5
    		],
    		[
    			-1,
    			10
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			-1,
    			13
    		],
    		[
    			0,
    			16
    		],
    		[
    			0,
    			5
    		],
    		[
    			1,
    			12
    		],
    		[
    			3,
    			4
    		],
    		[
    			1,
    			-4
    		],
    		[
    			1,
    			-7
    		],
    		[
    			1,
    			8
    		],
    		[
    			2,
    			-5
    		],
    		[
    			3,
    			-4
    		],
    		[
    			2,
    			4
    		],
    		[
    			1,
    			-11
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-3,
    			0
    		],
    		[
    			-1,
    			8
    		]
    	],
    	[
    		[
    			528,
    			7024
    		],
    		[
    			2,
    			-1
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			-5,
    			1
    		],
    		[
    			0,
    			5
    		],
    		[
    			2,
    			8
    		],
    		[
    			2,
    			-1
    		]
    	],
    	[
    		[
    			372,
    			6783
    		],
    		[
    			1,
    			-2
    		],
    		[
    			1,
    			-7
    		],
    		[
    			1,
    			-5
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-2,
    			15
    		],
    		[
    			1,
    			10
    		],
    		[
    			3,
    			9
    		],
    		[
    			3,
    			-1
    		],
    		[
    			0,
    			-6
    		],
    		[
    			1,
    			-5
    		],
    		[
    			1,
    			2
    		]
    	],
    	[
    		[
    			387,
    			6769
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-3,
    			3
    		],
    		[
    			-3,
    			-1
    		],
    		[
    			0,
    			2
    		],
    		[
    			6,
    			3
    		]
    	],
    	[
    		[
    			395,
    			6776
    		],
    		[
    			1,
    			-4
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-5,
    			4
    		],
    		[
    			1,
    			5
    		],
    		[
    			1,
    			3
    		],
    		[
    			3,
    			-2
    		],
    		[
    			2,
    			2
    		]
    	],
    	[
    		[
    			380,
    			6807
    		],
    		[
    			1,
    			-3
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			1,
    			-8
    		],
    		[
    			3,
    			0
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-2,
    			-13
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-1,
    			13
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			7
    		],
    		[
    			1,
    			6
    		],
    		[
    			2,
    			-3
    		],
    		[
    			2,
    			3
    		]
    	],
    	[
    		[
    			455,
    			6843
    		],
    		[
    			6,
    			-8
    		],
    		[
    			1,
    			-10
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-3,
    			6
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-2,
    			10
    		],
    		[
    			1,
    			12
    		]
    	],
    	[
    		[
    			94,
    			6363
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-3,
    			14
    		],
    		[
    			3,
    			0
    		],
    		[
    			1,
    			-11
    		],
    		[
    			0,
    			-2
    		]
    	],
    	[
    		[
    			247,
    			7337
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-3,
    			1
    		],
    		[
    			0,
    			6
    		],
    		[
    			3,
    			5
    		],
    		[
    			1,
    			-2
    		],
    		[
    			3,
    			4
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-3,
    			-10
    		]
    	],
    	[
    		[
    			2,
    			6239
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			1
    		],
    		[
    			0,
    			8
    		],
    		[
    			1,
    			5
    		],
    		[
    			1,
    			-7
    		]
    	],
    	[
    		[
    			5,
    			6253
    		],
    		[
    			-1,
    			8
    		],
    		[
    			2,
    			0
    		],
    		[
    			1,
    			-8
    		],
    		[
    			-2,
    			0
    		]
    	],
    	[
    		[
    			9971,
    			6308
    		],
    		[
    			4,
    			-3
    		],
    		[
    			0,
    			-6
    		],
    		[
    			3,
    			-6
    		],
    		[
    			2,
    			-10
    		],
    		[
    			1,
    			-5
    		],
    		[
    			2,
    			-2
    		],
    		[
    			1,
    			-9
    		],
    		[
    			1,
    			-1
    		],
    		[
    			3,
    			-1
    		],
    		[
    			2,
    			-5
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-3,
    			-2
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-5,
    			13
    		],
    		[
    			-3,
    			16
    		],
    		[
    			-3,
    			7
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-2,
    			5
    		],
    		[
    			1,
    			7
    		],
    		[
    			2,
    			-5
    		],
    		[
    			1,
    			0
    		]
    	],
    	[
    		[
    			66,
    			6352
    		],
    		[
    			-1,
    			11
    		],
    		[
    			1,
    			6
    		],
    		[
    			1,
    			2
    		],
    		[
    			3,
    			0
    		],
    		[
    			1,
    			5
    		],
    		[
    			1,
    			-1
    		],
    		[
    			-1,
    			-16
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			2,
    			-4
    		],
    		[
    			2,
    			1
    		],
    		[
    			3,
    			4
    		],
    		[
    			3,
    			1
    		],
    		[
    			0,
    			-10
    		],
    		[
    			0,
    			-14
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-5,
    			5
    		],
    		[
    			-2,
    			-13
    		],
    		[
    			-3,
    			-1
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			0,
    			8
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-2,
    			-17
    		],
    		[
    			-2,
    			1
    		],
    		[
    			0,
    			11
    		],
    		[
    			3,
    			14
    		],
    		[
    			0,
    			6
    		],
    		[
    			-1,
    			4
    		],
    		[
    			0,
    			5
    		],
    		[
    			4,
    			1
    		],
    		[
    			0,
    			9
    		]
    	],
    	[
    		[
    			38,
    			6335
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			1,
    			-5
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			1,
    			-9
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-4,
    			6
    		],
    		[
    			0,
    			4
    		],
    		[
    			4,
    			3
    		],
    		[
    			0,
    			11
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-4,
    			9
    		],
    		[
    			0,
    			9
    		],
    		[
    			2,
    			3
    		],
    		[
    			4,
    			-2
    		],
    		[
    			1,
    			1
    		],
    		[
    			1,
    			-7
    		],
    		[
    			0,
    			-4
    		],
    		[
    			2,
    			-6
    		],
    		[
    			3,
    			1
    		],
    		[
    			4,
    			5
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-4,
    			-5
    		],
    		[
    			0,
    			-3
    		]
    	],
    	[
    		[
    			50,
    			6326
    		],
    		[
    			-3,
    			-1
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-4,
    			-2
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-2,
    			9
    		],
    		[
    			2,
    			6
    		],
    		[
    			2,
    			-2
    		],
    		[
    			3,
    			5
    		],
    		[
    			5,
    			6
    		],
    		[
    			2,
    			6
    		],
    		[
    			0,
    			6
    		],
    		[
    			0,
    			15
    		],
    		[
    			1,
    			3
    		],
    		[
    			2,
    			-1
    		],
    		[
    			2,
    			-7
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			0,
    			-16
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-3,
    			-5
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-1,
    			7
    		]
    	],
    	[
    		[
    			10,
    			6329
    		],
    		[
    			-2,
    			7
    		],
    		[
    			0,
    			7
    		],
    		[
    			1,
    			4
    		],
    		[
    			2,
    			-6
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-1,
    			-3
    		]
    	],
    	[
    		[
    			9960,
    			6333
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-2,
    			8
    		],
    		[
    			2,
    			0
    		],
    		[
    			2,
    			-10
    		]
    	],
    	[
    		[
    			88,
    			6356
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-3,
    			4
    		],
    		[
    			1,
    			9
    		],
    		[
    			1,
    			2
    		],
    		[
    			1,
    			-4
    		],
    		[
    			1,
    			-1
    		],
    		[
    			1,
    			9
    		],
    		[
    			2,
    			2
    		],
    		[
    			0,
    			-5
    		]
    	],
    	[
    		[
    			9938,
    			6380
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			0,
    			-4
    		],
    		[
    			2,
    			-1
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-4,
    			3
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			-3,
    			9
    		],
    		[
    			3,
    			5
    		],
    		[
    			1,
    			8
    		],
    		[
    			5,
    			6
    		],
    		[
    			0,
    			8
    		],
    		[
    			1,
    			16
    		],
    		[
    			2,
    			3
    		],
    		[
    			2,
    			-9
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-1,
    			-9
    		]
    	],
    	[
    		[
    			9999,
    			6367
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-3,
    			5
    		],
    		[
    			-1,
    			7
    		],
    		[
    			0,
    			9
    		],
    		[
    			1,
    			0
    		],
    		[
    			2,
    			6
    		],
    		[
    			2,
    			1
    		],
    		[
    			3,
    			-10
    		],
    		[
    			0,
    			-4
    		]
    	],
    	[
    		[
    			9962,
    			6373
    		],
    		[
    			1,
    			2
    		],
    		[
    			2,
    			-3
    		],
    		[
    			1,
    			-5
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-1,
    			9
    		]
    	],
    	[
    		[
    			87,
    			6381
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-1,
    			12
    		],
    		[
    			2,
    			10
    		],
    		[
    			2,
    			-2
    		],
    		[
    			2,
    			-13
    		],
    		[
    			-1,
    			-3
    		]
    	],
    	[
    		[
    			9953,
    			6386
    		],
    		[
    			2,
    			-3
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-1,
    			9
    		],
    		[
    			1,
    			3
    		]
    	],
    	[
    		[
    			135,
    			6429
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-2,
    			5
    		],
    		[
    			0,
    			4
    		],
    		[
    			2,
    			-2
    		],
    		[
    			2,
    			5
    		],
    		[
    			-1,
    			7
    		],
    		[
    			4,
    			7
    		],
    		[
    			3,
    			-5
    		],
    		[
    			3,
    			-12
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-2,
    			-13
    		],
    		[
    			-4,
    			2
    		],
    		[
    			0,
    			-7
    		],
    		[
    			2,
    			-6
    		],
    		[
    			1,
    			-7
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-3,
    			2
    		],
    		[
    			-2,
    			-12
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-3,
    			-4
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-3,
    			-5
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-3,
    			2
    		],
    		[
    			-3,
    			-1
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-4,
    			1
    		],
    		[
    			3,
    			6
    		],
    		[
    			2,
    			2
    		],
    		[
    			1,
    			-5
    		],
    		[
    			1,
    			5
    		],
    		[
    			2,
    			0
    		],
    		[
    			1,
    			4
    		],
    		[
    			1,
    			7
    		],
    		[
    			2,
    			-5
    		],
    		[
    			1,
    			0
    		],
    		[
    			4,
    			3
    		],
    		[
    			3,
    			6
    		],
    		[
    			1,
    			7
    		],
    		[
    			3,
    			1
    		],
    		[
    			-1,
    			7
    		],
    		[
    			4,
    			-1
    		],
    		[
    			1,
    			5
    		],
    		[
    			0,
    			6
    		],
    		[
    			-1,
    			1
    		]
    	],
    	[
    		[
    			154,
    			6406
    		],
    		[
    			3,
    			-9
    		],
    		[
    			1,
    			2
    		],
    		[
    			3,
    			-2
    		],
    		[
    			0,
    			-2
    		],
    		[
    			7,
    			2
    		],
    		[
    			3,
    			-2
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-7,
    			-6
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-3,
    			3
    		],
    		[
    			-3,
    			-5
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-2,
    			9
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			6
    		],
    		[
    			4,
    			-1
    		],
    		[
    			3,
    			-3
    		],
    		[
    			2,
    			4
    		],
    		[
    			3,
    			5
    		]
    	],
    	[
    		[
    			181,
    			6427
    		],
    		[
    			1,
    			6
    		],
    		[
    			1,
    			9
    		],
    		[
    			4,
    			8
    		],
    		[
    			3,
    			-5
    		],
    		[
    			1,
    			-6
    		],
    		[
    			-3,
    			-10
    		],
    		[
    			-4,
    			-5
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-1,
    			3
    		]
    	],
    	[
    		[
    			9891,
    			6440
    		],
    		[
    			0,
    			7
    		],
    		[
    			2,
    			-3
    		],
    		[
    			-2,
    			-4
    		]
    	],
    	[
    		[
    			9827,
    			6466
    		],
    		[
    			1,
    			6
    		],
    		[
    			4,
    			1
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			0,
    			-6
    		],
    		[
    			0,
    			-4
    		],
    		[
    			1,
    			-12
    		],
    		[
    			-3,
    			0
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-4,
    			-3
    		],
    		[
    			-2,
    			3
    		],
    		[
    			0,
    			6
    		],
    		[
    			2,
    			4
    		],
    		[
    			2,
    			-1
    		],
    		[
    			2,
    			5
    		]
    	],
    	[
    		[
    			219,
    			6461
    		],
    		[
    			-1,
    			8
    		],
    		[
    			2,
    			7
    		],
    		[
    			2,
    			-6
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			-1,
    			0
    		]
    	],
    	[
    		[
    			231,
    			6481
    		],
    		[
    			1,
    			15
    		],
    		[
    			3,
    			8
    		],
    		[
    			2,
    			3
    		],
    		[
    			2,
    			-4
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-2,
    			3
    		]
    	],
    	[
    		[
    			250,
    			6524
    		],
    		[
    			3,
    			-2
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-3,
    			0
    		],
    		[
    			0,
    			12
    		]
    	],
    	[
    		[
    			9804,
    			6531
    		],
    		[
    			-1,
    			10
    		],
    		[
    			-3,
    			9
    		],
    		[
    			-3,
    			-4
    		],
    		[
    			-2,
    			4
    		],
    		[
    			5,
    			14
    		],
    		[
    			3,
    			2
    		],
    		[
    			10,
    			-3
    		],
    		[
    			3,
    			-10
    		],
    		[
    			3,
    			-3
    		],
    		[
    			3,
    			-15
    		],
    		[
    			0,
    			-3
    		],
    		[
    			-3,
    			-1
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-4,
    			2
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-3,
    			6
    		],
    		[
    			-1,
    			6
    		]
    	],
    	[
    		[
    			256,
    			6538
    		],
    		[
    			3,
    			0
    		],
    		[
    			2,
    			6
    		],
    		[
    			2,
    			-1
    		],
    		[
    			1,
    			-4
    		],
    		[
    			-1,
    			-14
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-3,
    			5
    		],
    		[
    			-3,
    			-5
    		],
    		[
    			-2,
    			7
    		],
    		[
    			1,
    			5
    		],
    		[
    			1,
    			1
    		]
    	],
    	[
    		[
    			305,
    			6612
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-2,
    			-10
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-3,
    			-13
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-3,
    			-2
    		],
    		[
    			-3,
    			-11
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-5,
    			-13
    		],
    		[
    			-3,
    			-8
    		],
    		[
    			-1,
    			4
    		],
    		[
    			3,
    			5
    		],
    		[
    			3,
    			15
    		],
    		[
    			2,
    			21
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			7
    		],
    		[
    			1,
    			7
    		],
    		[
    			4,
    			15
    		],
    		[
    			3,
    			-2
    		],
    		[
    			2,
    			3
    		],
    		[
    			2,
    			-3
    		],
    		[
    			0,
    			11
    		],
    		[
    			-1,
    			7
    		],
    		[
    			1,
    			16
    		],
    		[
    			1,
    			8
    		],
    		[
    			4,
    			11
    		],
    		[
    			5,
    			6
    		],
    		[
    			2,
    			-5
    		],
    		[
    			1,
    			-4
    		],
    		[
    			3,
    			0
    		],
    		[
    			1,
    			-3
    		],
    		[
    			-3,
    			-12
    		],
    		[
    			1,
    			-10
    		],
    		[
    			-6,
    			-15
    		],
    		[
    			-4,
    			-9
    		]
    	],
    	[
    		[
    			255,
    			6544
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-1,
    			3
    		],
    		[
    			0,
    			6
    		],
    		[
    			0,
    			4
    		],
    		[
    			3,
    			-3
    		],
    		[
    			0,
    			-3
    		]
    	],
    	[
    		[
    			263,
    			6554
    		],
    		[
    			-2,
    			6
    		],
    		[
    			1,
    			8
    		],
    		[
    			2,
    			3
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-1,
    			-9
    		]
    	],
    	[
    		[
    			346,
    			6752
    		],
    		[
    			2,
    			2
    		],
    		[
    			2,
    			-6
    		],
    		[
    			-2,
    			-11
    		],
    		[
    			1,
    			-6
    		],
    		[
    			2,
    			-2
    		],
    		[
    			3,
    			5
    		],
    		[
    			0,
    			9
    		],
    		[
    			2,
    			10
    		],
    		[
    			0,
    			-6
    		],
    		[
    			1,
    			-3
    		],
    		[
    			1,
    			4
    		],
    		[
    			2,
    			-9
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-3,
    			-2
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-4,
    			-12
    		],
    		[
    			0,
    			-6
    		],
    		[
    			2,
    			4
    		],
    		[
    			2,
    			5
    		],
    		[
    			5,
    			10
    		],
    		[
    			1,
    			4
    		],
    		[
    			2,
    			3
    		],
    		[
    			1,
    			-3
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-3,
    			-5
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-4,
    			-8
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-1,
    			-18
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-4,
    			0
    		],
    		[
    			-5,
    			-12
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			-3,
    			4
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-4,
    			6
    		],
    		[
    			-1,
    			6
    		],
    		[
    			1,
    			4
    		],
    		[
    			3,
    			10
    		],
    		[
    			2,
    			-1
    		],
    		[
    			4,
    			7
    		],
    		[
    			1,
    			4
    		],
    		[
    			2,
    			-4
    		],
    		[
    			3,
    			11
    		],
    		[
    			2,
    			-3
    		],
    		[
    			1,
    			7
    		],
    		[
    			2,
    			2
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-1,
    			10
    		],
    		[
    			0,
    			4
    		],
    		[
    			3,
    			-1
    		],
    		[
    			1,
    			3
    		],
    		[
    			-2,
    			6
    		],
    		[
    			1,
    			6
    		],
    		[
    			1,
    			4
    		],
    		[
    			3,
    			-1
    		],
    		[
    			1,
    			-8
    		],
    		[
    			2,
    			-1
    		],
    		[
    			0,
    			13
    		],
    		[
    			-5,
    			7
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-4,
    			13
    		],
    		[
    			0,
    			7
    		],
    		[
    			4,
    			15
    		],
    		[
    			4,
    			8
    		],
    		[
    			1,
    			1
    		],
    		[
    			2,
    			4
    		],
    		[
    			1,
    			-2
    		]
    	],
    	[
    		[
    			267,
    			7239
    		],
    		[
    			2,
    			-4
    		],
    		[
    			-3,
    			-9
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-1,
    			6
    		],
    		[
    			5,
    			-3
    		],
    		[
    			1,
    			0
    		]
    	],
    	[
    		[
    			170,
    			7991
    		],
    		[
    			-2,
    			7
    		],
    		[
    			1,
    			6
    		],
    		[
    			1,
    			-13
    		]
    	],
    	[
    		[
    			374,
    			7906
    		],
    		[
    			1,
    			-4
    		],
    		[
    			0,
    			-17
    		],
    		[
    			1,
    			-12
    		],
    		[
    			2,
    			-5
    		],
    		[
    			1,
    			0
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			-3,
    			-2
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-7,
    			-9
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			1,
    			-7
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-3,
    			0
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-5,
    			11
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-5,
    			-2
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-3,
    			4
    		],
    		[
    			-4,
    			13
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-4,
    			0
    		],
    		[
    			-3,
    			12
    		],
    		[
    			-3,
    			3
    		],
    		[
    			-1,
    			14
    		],
    		[
    			-1,
    			9
    		],
    		[
    			3,
    			8
    		],
    		[
    			5,
    			-1
    		],
    		[
    			5,
    			-5
    		],
    		[
    			4,
    			4
    		],
    		[
    			-1,
    			9
    		],
    		[
    			2,
    			6
    		],
    		[
    			3,
    			3
    		],
    		[
    			2,
    			-1
    		],
    		[
    			1,
    			7
    		],
    		[
    			2,
    			7
    		],
    		[
    			3,
    			-7
    		],
    		[
    			2,
    			4
    		],
    		[
    			3,
    			4
    		],
    		[
    			2,
    			-4
    		],
    		[
    			1,
    			-10
    		],
    		[
    			4,
    			-1
    		],
    		[
    			2,
    			5
    		],
    		[
    			4,
    			-7
    		],
    		[
    			1,
    			-6
    		],
    		[
    			-1,
    			-20
    		]
    	],
    	[
    		[
    			170,
    			7971
    		],
    		[
    			0,
    			6
    		],
    		[
    			3,
    			11
    		],
    		[
    			0,
    			-1
    		],
    		[
    			1,
    			-13
    		],
    		[
    			3,
    			-14
    		],
    		[
    			7,
    			-13
    		],
    		[
    			5,
    			-1
    		],
    		[
    			4,
    			-12
    		],
    		[
    			-4,
    			3
    		],
    		[
    			-3,
    			0
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			-4,
    			7
    		],
    		[
    			-6,
    			23
    		],
    		[
    			-3,
    			3
    		],
    		[
    			0,
    			4
    		]
    	],
    	[
    		[
    			508,
    			7640
    		],
    		[
    			2,
    			1
    		],
    		[
    			4,
    			12
    		],
    		[
    			0,
    			-1
    		],
    		[
    			-5,
    			-43
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-4,
    			0
    		],
    		[
    			0,
    			7
    		],
    		[
    			1,
    			21
    		],
    		[
    			4,
    			9
    		]
    	],
    	[
    		[
    			1220,
    			7691
    		],
    		[
    			2,
    			-12
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-1,
    			14
    		]
    	],
    	[
    		[
    			790,
    			7749
    		],
    		[
    			3,
    			15
    		],
    		[
    			2,
    			-3
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-2,
    			-10
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-2,
    			3
    		],
    		[
    			0,
    			4
    		]
    	],
    	[
    		[
    			758,
    			7971
    		],
    		[
    			3,
    			-6
    		],
    		[
    			-3,
    			-10
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			1,
    			-4
    		],
    		[
    			-4,
    			-1
    		],
    		[
    			3,
    			10
    		],
    		[
    			1,
    			18
    		],
    		[
    			0,
    			1
    		]
    	],
    	[
    		[
    			713,
    			7760
    		],
    		[
    			1,
    			0
    		],
    		[
    			3,
    			5
    		],
    		[
    			2,
    			-7
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-3,
    			0
    		],
    		[
    			-2,
    			10
    		],
    		[
    			1,
    			3
    		]
    	],
    	[
    		[
    			1336,
    			6959
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			0,
    			9
    		],
    		[
    			1,
    			3
    		]
    	],
    	[
    		[
    			1334,
    			6936
    		],
    		[
    			1,
    			-11
    		],
    		[
    			1,
    			-3
    		],
    		[
    			-2,
    			-10
    		],
    		[
    			-3,
    			0
    		],
    		[
    			-3,
    			10
    		],
    		[
    			0,
    			7
    		],
    		[
    			6,
    			9
    		],
    		[
    			0,
    			-2
    		]
    	],
    	[
    		[
    			1320,
    			7010
    		],
    		[
    			3,
    			-14
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			0,
    			-11
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-1,
    			-14
    		],
    		[
    			-2,
    			14
    		],
    		[
    			-1,
    			17
    		],
    		[
    			0,
    			14
    		],
    		[
    			1,
    			10
    		],
    		[
    			1,
    			-1
    		],
    		[
    			1,
    			-6
    		]
    	],
    	[
    		[
    			567,
    			7105
    		],
    		[
    			1,
    			-3
    		],
    		[
    			2,
    			-6
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-4,
    			10
    		],
    		[
    			2,
    			2
    		]
    	],
    	[
    		[
    			557,
    			7102
    		],
    		[
    			2,
    			-4
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-2,
    			3
    		],
    		[
    			1,
    			6
    		]
    	],
    	[
    		[
    			551,
    			7089
    		],
    		[
    			1,
    			2
    		],
    		[
    			1,
    			-10
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			0,
    			10
    		]
    	],
    	[
    		[
    			594,
    			7195
    		],
    		[
    			1,
    			-9
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-2,
    			6
    		],
    		[
    			2,
    			5
    		]
    	],
    	[
    		[
    			616,
    			7230
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-4,
    			-1
    		],
    		[
    			0,
    			3
    		],
    		[
    			2,
    			7
    		],
    		[
    			5,
    			0
    		],
    		[
    			1,
    			-4
    		]
    	],
    	[
    		[
    			1279,
    			7015
    		],
    		[
    			-2,
    			1
    		],
    		[
    			0,
    			6
    		],
    		[
    			2,
    			1
    		],
    		[
    			0,
    			-8
    		]
    	],
    	[
    		[
    			1325,
    			6992
    		],
    		[
    			3,
    			-6
    		],
    		[
    			0,
    			-6
    		],
    		[
    			2,
    			-2
    		],
    		[
    			2,
    			-9
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			1,
    			-17
    		],
    		[
    			-2,
    			-10
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-1,
    			5
    		],
    		[
    			2,
    			10
    		],
    		[
    			0,
    			7
    		],
    		[
    			1,
    			3
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-1,
    			11
    		],
    		[
    			1,
    			9
    		]
    	],
    	[
    		[
    			1276,
    			7045
    		],
    		[
    			2,
    			-6
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-3,
    			-7
    		],
    		[
    			2,
    			-3
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			-1,
    			-15
    		],
    		[
    			-3,
    			11
    		],
    		[
    			2,
    			11
    		],
    		[
    			0,
    			13
    		],
    		[
    			-3,
    			8
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			0,
    			15
    		],
    		[
    			1,
    			4
    		],
    		[
    			3,
    			-2
    		],
    		[
    			1,
    			-8
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			0,
    			-6
    		],
    		[
    			2,
    			6
    		],
    		[
    			1,
    			7
    		],
    		[
    			1,
    			-3
    		],
    		[
    			1,
    			9
    		],
    		[
    			3,
    			2
    		]
    	],
    	[
    		[
    			1262,
    			7108
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			9
    		],
    		[
    			1,
    			5
    		],
    		[
    			2,
    			2
    		],
    		[
    			0,
    			-5
    		]
    	],
    	[
    		[
    			1283,
    			7018
    		],
    		[
    			-2,
    			14
    		],
    		[
    			1,
    			2
    		],
    		[
    			-1,
    			14
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-4,
    			10
    		],
    		[
    			2,
    			9
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-3,
    			3
    		],
    		[
    			1,
    			-9
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-3,
    			7
    		],
    		[
    			-2,
    			9
    		],
    		[
    			1,
    			8
    		],
    		[
    			3,
    			3
    		],
    		[
    			4,
    			-9
    		],
    		[
    			2,
    			3
    		],
    		[
    			-1,
    			13
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-2,
    			13
    		],
    		[
    			-3,
    			-10
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-3,
    			6
    		],
    		[
    			0,
    			7
    		],
    		[
    			1,
    			3
    		],
    		[
    			2,
    			17
    		],
    		[
    			4,
    			13
    		],
    		[
    			0,
    			4
    		],
    		[
    			-2,
    			7
    		],
    		[
    			-1,
    			21
    		],
    		[
    			1,
    			6
    		],
    		[
    			1,
    			1
    		],
    		[
    			5,
    			-3
    		],
    		[
    			2,
    			0
    		],
    		[
    			5,
    			-3
    		],
    		[
    			3,
    			-15
    		],
    		[
    			0,
    			-10
    		],
    		[
    			0,
    			-11
    		],
    		[
    			4,
    			-17
    		],
    		[
    			2,
    			-2
    		],
    		[
    			6,
    			-19
    		],
    		[
    			4,
    			-26
    		],
    		[
    			1,
    			-19
    		],
    		[
    			2,
    			-6
    		],
    		[
    			1,
    			-13
    		],
    		[
    			1,
    			-6
    		],
    		[
    			3,
    			-7
    		],
    		[
    			1,
    			-8
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-8,
    			15
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-3,
    			-12
    		],
    		[
    			2,
    			-1
    		],
    		[
    			1,
    			8
    		],
    		[
    			1,
    			-3
    		],
    		[
    			2,
    			1
    		],
    		[
    			1,
    			-6
    		],
    		[
    			2,
    			-2
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-5,
    			-2
    		],
    		[
    			3,
    			-4
    		],
    		[
    			3,
    			3
    		],
    		[
    			1,
    			-8
    		],
    		[
    			2,
    			-3
    		],
    		[
    			1,
    			-14
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			2,
    			-3
    		],
    		[
    			1,
    			1
    		],
    		[
    			0,
    			6
    		],
    		[
    			2,
    			7
    		],
    		[
    			1,
    			-3
    		],
    		[
    			0,
    			-9
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-2,
    			-15
    		],
    		[
    			-3,
    			-7
    		],
    		[
    			2,
    			-3
    		],
    		[
    			2,
    			9
    		],
    		[
    			2,
    			-1
    		],
    		[
    			0,
    			-33
    		],
    		[
    			1,
    			-12
    		],
    		[
    			-2,
    			-17
    		],
    		[
    			-4,
    			-1
    		],
    		[
    			-3,
    			8
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-1,
    			18
    		],
    		[
    			1,
    			6
    		],
    		[
    			-2,
    			12
    		],
    		[
    			-3,
    			-2
    		],
    		[
    			-4,
    			12
    		],
    		[
    			1,
    			6
    		],
    		[
    			1,
    			19
    		],
    		[
    			-2,
    			3
    		],
    		[
    			0,
    			7
    		],
    		[
    			-3,
    			-4
    		],
    		[
    			1,
    			-16
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-5,
    			9
    		],
    		[
    			0,
    			7
    		],
    		[
    			1,
    			8
    		],
    		[
    			-2,
    			16
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-2,
    			0
    		],
    		[
    			2,
    			-12
    		],
    		[
    			1,
    			-11
    		],
    		[
    			1,
    			-11
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			2,
    			-3
    		],
    		[
    			2,
    			-23
    		],
    		[
    			2,
    			-5
    		],
    		[
    			0,
    			10
    		],
    		[
    			2,
    			3
    		],
    		[
    			2,
    			-7
    		],
    		[
    			1,
    			-3
    		],
    		[
    			0,
    			-20
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-2,
    			12
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			3,
    			-26
    		],
    		[
    			-3,
    			-2
    		],
    		[
    			-3,
    			5
    		],
    		[
    			0,
    			10
    		],
    		[
    			-2,
    			7
    		],
    		[
    			-2,
    			12
    		],
    		[
    			-3,
    			16
    		],
    		[
    			-1,
    			4
    		],
    		[
    			0,
    			13
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			10
    		],
    		[
    			3,
    			1
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			9
    		],
    		[
    			2,
    			3
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-3,
    			-4
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-1,
    			7
    		],
    		[
    			1,
    			13
    		],
    		[
    			2,
    			4
    		],
    		[
    			1,
    			1
    		],
    		[
    			1,
    			-10
    		],
    		[
    			2,
    			3
    		],
    		[
    			-1,
    			8
    		],
    		[
    			1,
    			6
    		],
    		[
    			3,
    			-1
    		],
    		[
    			2,
    			-4
    		],
    		[
    			0,
    			9
    		],
    		[
    			-1,
    			4
    		]
    	],
    	[
    		[
    			882,
    			7990
    		],
    		[
    			0,
    			7
    		],
    		[
    			0,
    			13
    		],
    		[
    			3,
    			3
    		],
    		[
    			2,
    			-14
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-4,
    			-2
    		]
    	],
    	[
    		[
    			886,
    			7931
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-4,
    			-10
    		],
    		[
    			0,
    			8
    		],
    		[
    			4,
    			7
    		]
    	],
    	[
    		[
    			890,
    			7929
    		],
    		[
    			0,
    			5
    		],
    		[
    			0,
    			5
    		],
    		[
    			2,
    			6
    		],
    		[
    			2,
    			-7
    		],
    		[
    			1,
    			-3
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			0,
    			-5
    		],
    		[
    			4,
    			9
    		],
    		[
    			1,
    			-3
    		],
    		[
    			-2,
    			-12
    		],
    		[
    			-6,
    			-16
    		],
    		[
    			-5,
    			-20
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-3,
    			-9
    		],
    		[
    			0,
    			-6
    		],
    		[
    			1,
    			-2
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-3,
    			2
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-4,
    			-7
    		],
    		[
    			-1,
    			3
    		],
    		[
    			1,
    			13
    		],
    		[
    			2,
    			3
    		],
    		[
    			0,
    			9
    		],
    		[
    			2,
    			6
    		],
    		[
    			1,
    			0
    		],
    		[
    			2,
    			7
    		],
    		[
    			2,
    			9
    		],
    		[
    			4,
    			8
    		],
    		[
    			3,
    			18
    		],
    		[
    			0,
    			6
    		],
    		[
    			2,
    			1
    		],
    		[
    			1,
    			8
    		],
    		[
    			0,
    			4
    		]
    	],
    	[
    		[
    			880,
    			7983
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-1,
    			-13
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			2,
    			-7
    		],
    		[
    			-2,
    			-15
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-2,
    			-17
    		],
    		[
    			-2,
    			8
    		],
    		[
    			0,
    			4
    		],
    		[
    			-3,
    			2
    		],
    		[
    			1,
    			8
    		],
    		[
    			3,
    			38
    		],
    		[
    			2,
    			0
    		],
    		[
    			0,
    			6
    		],
    		[
    			3,
    			11
    		],
    		[
    			2,
    			3
    		]
    	],
    	[
    		[
    			869,
    			8013
    		],
    		[
    			1,
    			-1
    		],
    		[
    			2,
    			-7
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-3,
    			13
    		],
    		[
    			2,
    			3
    		]
    	],
    	[
    		[
    			892,
    			8045
    		],
    		[
    			2,
    			-4
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-5,
    			5
    		],
    		[
    			2,
    			6
    		],
    		[
    			3,
    			0
    		]
    	],
    	[
    		[
    			1298,
    			7244
    		],
    		[
    			1,
    			7
    		],
    		[
    			2,
    			-3
    		],
    		[
    			3,
    			-1
    		],
    		[
    			-2,
    			-12
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-3,
    			9
    		]
    	],
    	[
    		[
    			1288,
    			7144
    		],
    		[
    			-2,
    			10
    		],
    		[
    			0,
    			17
    		],
    		[
    			1,
    			-1
    		],
    		[
    			1,
    			-5
    		],
    		[
    			1,
    			-15
    		],
    		[
    			-1,
    			-6
    		]
    	],
    	[
    		[
    			1299,
    			7231
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-2,
    			-17
    		],
    		[
    			-2,
    			4
    		],
    		[
    			2,
    			7
    		],
    		[
    			2,
    			10
    		]
    	],
    	[
    		[
    			1298,
    			7201
    		],
    		[
    			2,
    			7
    		],
    		[
    			2,
    			-7
    		],
    		[
    			0,
    			-3
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-2,
    			2
    		],
    		[
    			0,
    			7
    		]
    	],
    	[
    		[
    			1286,
    			7208
    		],
    		[
    			3,
    			3
    		],
    		[
    			2,
    			-3
    		],
    		[
    			2,
    			3
    		],
    		[
    			2,
    			-3
    		],
    		[
    			1,
    			-9
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			1,
    			-8
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-4,
    			-3
    		],
    		[
    			-5,
    			17
    		],
    		[
    			0,
    			7
    		],
    		[
    			2,
    			13
    		]
    	],
    	[
    		[
    			1201,
    			7560
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-1,
    			4
    		],
    		[
    			1,
    			5
    		],
    		[
    			2,
    			3
    		]
    	],
    	[
    		[
    			1212,
    			7571
    		],
    		[
    			3,
    			-9
    		],
    		[
    			-3,
    			-1
    		],
    		[
    			-2,
    			7
    		],
    		[
    			2,
    			3
    		]
    	],
    	[
    		[
    			1238,
    			7541
    		],
    		[
    			0,
    			-11
    		],
    		[
    			2,
    			0
    		],
    		[
    			2,
    			6
    		],
    		[
    			1,
    			-3
    		],
    		[
    			2,
    			-1
    		],
    		[
    			2,
    			-4
    		],
    		[
    			5,
    			2
    		],
    		[
    			1,
    			-5
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			3,
    			-12
    		],
    		[
    			0,
    			-8
    		],
    		[
    			2,
    			-8
    		],
    		[
    			2,
    			-14
    		],
    		[
    			1,
    			-9
    		],
    		[
    			1,
    			-23
    		],
    		[
    			2,
    			-10
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			0,
    			8
    		],
    		[
    			-4,
    			18
    		],
    		[
    			-1,
    			19
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-2,
    			0
    		],
    		[
    			3,
    			-16
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			1,
    			-6
    		],
    		[
    			2,
    			-13
    		],
    		[
    			3,
    			-8
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			3,
    			-19
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			1,
    			-14
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-2,
    			-10
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-2,
    			-16
    		],
    		[
    			-3,
    			-14
    		],
    		[
    			-3,
    			-4
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-3,
    			-10
    		],
    		[
    			-3,
    			0
    		],
    		[
    			-1,
    			14
    		],
    		[
    			0,
    			22
    		],
    		[
    			1,
    			9
    		],
    		[
    			2,
    			8
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			11
    		],
    		[
    			2,
    			-6
    		],
    		[
    			1,
    			4
    		],
    		[
    			-4,
    			23
    		],
    		[
    			0,
    			9
    		],
    		[
    			-2,
    			10
    		],
    		[
    			-1,
    			13
    		],
    		[
    			-1,
    			7
    		],
    		[
    			1,
    			20
    		],
    		[
    			-1,
    			13
    		],
    		[
    			0,
    			15
    		],
    		[
    			-1,
    			15
    		],
    		[
    			0,
    			7
    		],
    		[
    			-2,
    			15
    		],
    		[
    			-2,
    			7
    		],
    		[
    			-1,
    			13
    		],
    		[
    			0,
    			16
    		],
    		[
    			0,
    			8
    		],
    		[
    			4,
    			-17
    		],
    		[
    			1,
    			-8
    		],
    		[
    			2,
    			-2
    		],
    		[
    			0,
    			-9
    		]
    	],
    	[
    		[
    			626,
    			7138
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-2,
    			1
    		],
    		[
    			2,
    			6
    		]
    	],
    	[
    		[
    			760,
    			7548
    		],
    		[
    			2,
    			-2
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			-2,
    			2
    		],
    		[
    			1,
    			12
    		]
    	],
    	[
    		[
    			758,
    			7671
    		],
    		[
    			-4,
    			0
    		],
    		[
    			1,
    			6
    		],
    		[
    			1,
    			-1
    		],
    		[
    			2,
    			-5
    		]
    	],
    	[
    		[
    			654,
    			7099
    		],
    		[
    			1,
    			7
    		],
    		[
    			1,
    			3
    		],
    		[
    			1,
    			-5
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			1,
    			-7
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-3,
    			2
    		],
    		[
    			-1,
    			10
    		],
    		[
    			2,
    			6
    		]
    	],
    	[
    		[
    			750,
    			7545
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			1,
    			-16
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-4,
    			2
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			1,
    			9
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-1,
    			-18
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-3,
    			-2
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-4,
    			7
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			2,
    			-10
    		],
    		[
    			4,
    			-8
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-4,
    			4
    		],
    		[
    			-6,
    			8
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-1,
    			6
    		],
    		[
    			3,
    			13
    		],
    		[
    			1,
    			1
    		],
    		[
    			2,
    			-8
    		],
    		[
    			1,
    			5
    		],
    		[
    			-2,
    			6
    		],
    		[
    			1,
    			9
    		],
    		[
    			1,
    			1
    		],
    		[
    			2,
    			-4
    		],
    		[
    			2,
    			5
    		],
    		[
    			-2,
    			7
    		],
    		[
    			1,
    			9
    		],
    		[
    			3,
    			-5
    		],
    		[
    			2,
    			1
    		],
    		[
    			-2,
    			9
    		],
    		[
    			1,
    			2
    		],
    		[
    			2,
    			-3
    		],
    		[
    			2,
    			8
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-1,
    			5
    		],
    		[
    			2,
    			2
    		],
    		[
    			2,
    			9
    		],
    		[
    			3,
    			3
    		],
    		[
    			-1,
    			6
    		],
    		[
    			0,
    			11
    		],
    		[
    			2,
    			10
    		],
    		[
    			2,
    			-5
    		],
    		[
    			2,
    			5
    		],
    		[
    			2,
    			3
    		],
    		[
    			1,
    			-9
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-3,
    			-16
    		],
    		[
    			1,
    			-14
    		],
    		[
    			3,
    			2
    		],
    		[
    			0,
    			11
    		],
    		[
    			2,
    			-1
    		],
    		[
    			3,
    			-12
    		],
    		[
    			2,
    			8
    		],
    		[
    			1,
    			-5
    		],
    		[
    			-2,
    			-14
    		],
    		[
    			5,
    			10
    		],
    		[
    			0,
    			-4
    		],
    		[
    			0,
    			-11
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-3,
    			-11
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-2,
    			4
    		],
    		[
    			0,
    			8
    		],
    		[
    			-1,
    			5
    		]
    	],
    	[
    		[
    			689,
    			7233
    		],
    		[
    			1,
    			-4
    		],
    		[
    			-4,
    			-9
    		],
    		[
    			-3,
    			-6
    		],
    		[
    			-3,
    			-13
    		],
    		[
    			-2,
    			6
    		],
    		[
    			3,
    			16
    		],
    		[
    			5,
    			15
    		],
    		[
    			2,
    			0
    		],
    		[
    			1,
    			-5
    		]
    	],
    	[
    		[
    			702,
    			7230
    		],
    		[
    			2,
    			-5
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-5,
    			-1
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-3,
    			4
    		],
    		[
    			-1,
    			6
    		],
    		[
    			2,
    			10
    		],
    		[
    			2,
    			3
    		],
    		[
    			1,
    			-1
    		],
    		[
    			3,
    			2
    		],
    		[
    			1,
    			-11
    		],
    		[
    			3,
    			0
    		]
    	],
    	[
    		[
    			745,
    			7465
    		],
    		[
    			2,
    			4
    		],
    		[
    			1,
    			-10
    		],
    		[
    			-4,
    			-1
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			2,
    			-13
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			1,
    			-2
    		],
    		[
    			2,
    			5
    		],
    		[
    			3,
    			1
    		],
    		[
    			3,
    			-1
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-4,
    			-13
    		],
    		[
    			-1,
    			-14
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-4,
    			4
    		],
    		[
    			0,
    			-3
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-2,
    			3
    		],
    		[
    			0,
    			5
    		],
    		[
    			-5,
    			-3
    		],
    		[
    			4,
    			-6
    		],
    		[
    			5,
    			-14
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-3,
    			3
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			0,
    			-7
    		],
    		[
    			2,
    			3
    		],
    		[
    			2,
    			-8
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-3,
    			2
    		],
    		[
    			1,
    			-8
    		],
    		[
    			6,
    			2
    		],
    		[
    			2,
    			-4
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-4,
    			-5
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			1,
    			-8
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-1,
    			3
    		],
    		[
    			0,
    			6
    		],
    		[
    			-2,
    			8
    		],
    		[
    			1,
    			7
    		],
    		[
    			3,
    			10
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-4,
    			-20
    		],
    		[
    			-3,
    			1
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			0,
    			-6
    		],
    		[
    			2,
    			-1
    		],
    		[
    			1,
    			-10
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			1,
    			-4
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-2,
    			-13
    		],
    		[
    			-3,
    			-4
    		],
    		[
    			0,
    			3
    		],
    		[
    			-3,
    			-4
    		],
    		[
    			0,
    			8
    		],
    		[
    			2,
    			11
    		],
    		[
    			1,
    			3
    		],
    		[
    			2,
    			11
    		],
    		[
    			3,
    			8
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			0,
    			8
    		],
    		[
    			1,
    			12
    		],
    		[
    			4,
    			10
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-3,
    			-10
    		],
    		[
    			-3,
    			-18
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			0,
    			13
    		],
    		[
    			-2,
    			8
    		],
    		[
    			-4,
    			6
    		],
    		[
    			0,
    			16
    		],
    		[
    			0,
    			22
    		],
    		[
    			-3,
    			14
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-1,
    			6
    		],
    		[
    			1,
    			16
    		],
    		[
    			0,
    			8
    		],
    		[
    			2,
    			12
    		],
    		[
    			2,
    			6
    		],
    		[
    			1,
    			7
    		],
    		[
    			2,
    			-2
    		],
    		[
    			3,
    			12
    		],
    		[
    			3,
    			5
    		],
    		[
    			4,
    			-2
    		],
    		[
    			2,
    			2
    		],
    		[
    			1,
    			-2
    		],
    		[
    			0,
    			-18
    		],
    		[
    			2,
    			-4
    		],
    		[
    			0,
    			-20
    		],
    		[
    			3,
    			-14
    		],
    		[
    			1,
    			4
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-2,
    			6
    		],
    		[
    			0,
    			11
    		],
    		[
    			0,
    			7
    		],
    		[
    			2,
    			9
    		],
    		[
    			-2,
    			8
    		],
    		[
    			1,
    			4
    		],
    		[
    			5,
    			-3
    		],
    		[
    			0,
    			6
    		],
    		[
    			-6,
    			7
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			0,
    			21
    		],
    		[
    			3,
    			10
    		],
    		[
    			3,
    			4
    		],
    		[
    			2,
    			-2
    		],
    		[
    			3,
    			-9
    		],
    		[
    			0,
    			-8
    		],
    		[
    			0,
    			-13
    		],
    		[
    			2,
    			2
    		],
    		[
    			1,
    			21
    		],
    		[
    			3,
    			-6
    		],
    		[
    			0,
    			8
    		],
    		[
    			-3,
    			6
    		],
    		[
    			-3,
    			9
    		],
    		[
    			1,
    			7
    		],
    		[
    			2,
    			-1
    		],
    		[
    			5,
    			-14
    		],
    		[
    			1,
    			1
    		],
    		[
    			3,
    			-7
    		],
    		[
    			1,
    			2
    		],
    		[
    			-3,
    			12
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-1,
    			7
    		],
    		[
    			2,
    			0
    		],
    		[
    			3,
    			-9
    		],
    		[
    			1,
    			-2
    		],
    		[
    			2,
    			4
    		],
    		[
    			4,
    			-5
    		],
    		[
    			0,
    			12
    		],
    		[
    			4,
    			-1
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-5,
    			-20
    		],
    		[
    			0,
    			-13
    		],
    		[
    			2,
    			-6
    		],
    		[
    			0,
    			15
    		],
    		[
    			1,
    			7
    		],
    		[
    			2,
    			-4
    		],
    		[
    			3,
    			9
    		],
    		[
    			0,
    			7
    		],
    		[
    			2,
    			-4
    		],
    		[
    			2,
    			12
    		],
    		[
    			1,
    			-6
    		],
    		[
    			3,
    			-3
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			2,
    			-14
    		]
    	],
    	[
    		[
    			1250,
    			7112
    		],
    		[
    			3,
    			-7
    		],
    		[
    			-3,
    			-12
    		],
    		[
    			-2,
    			3
    		],
    		[
    			0,
    			16
    		],
    		[
    			2,
    			0
    		]
    	],
    	[
    		[
    			1254,
    			7139
    		],
    		[
    			1,
    			-4
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-2,
    			10
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			10
    		],
    		[
    			1,
    			8
    		],
    		[
    			0,
    			11
    		],
    		[
    			0,
    			9
    		],
    		[
    			-2,
    			4
    		],
    		[
    			1,
    			12
    		],
    		[
    			2,
    			10
    		],
    		[
    			2,
    			0
    		],
    		[
    			2,
    			-3
    		],
    		[
    			1,
    			5
    		],
    		[
    			-2,
    			10
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-4,
    			18
    		],
    		[
    			0,
    			7
    		],
    		[
    			-3,
    			10
    		],
    		[
    			0,
    			9
    		],
    		[
    			-1,
    			21
    		],
    		[
    			2,
    			12
    		],
    		[
    			2,
    			1
    		],
    		[
    			3,
    			-10
    		],
    		[
    			1,
    			6
    		],
    		[
    			-2,
    			4
    		],
    		[
    			2,
    			4
    		],
    		[
    			1,
    			1
    		],
    		[
    			2,
    			-7
    		],
    		[
    			2,
    			-18
    		],
    		[
    			1,
    			-7
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			2,
    			-2
    		],
    		[
    			1,
    			16
    		],
    		[
    			3,
    			-7
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			0,
    			-10
    		],
    		[
    			1,
    			-6
    		],
    		[
    			1,
    			-10
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-3,
    			0
    		],
    		[
    			-1,
    			-16
    		],
    		[
    			1,
    			-10
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			2,
    			-5
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-2,
    			-21
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			0,
    			-6
    		],
    		[
    			0,
    			-14
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			0,
    			5
    		],
    		[
    			0,
    			9
    		],
    		[
    			-1,
    			12
    		],
    		[
    			-1,
    			0
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			2,
    			-4
    		],
    		[
    			-1,
    			-13
    		]
    	],
    	[
    		[
    			1298,
    			7239
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-3,
    			-6
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-5,
    			2
    		],
    		[
    			-1,
    			11
    		],
    		[
    			2,
    			5
    		],
    		[
    			-2,
    			12
    		],
    		[
    			-3,
    			7
    		],
    		[
    			-2,
    			20
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			0,
    			-10
    		],
    		[
    			1,
    			-1
    		],
    		[
    			1,
    			-5
    		],
    		[
    			0,
    			-11
    		],
    		[
    			2,
    			-2
    		],
    		[
    			2,
    			-4
    		],
    		[
    			0,
    			-17
    		],
    		[
    			-2,
    			-12
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-4,
    			4
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-2,
    			2
    		],
    		[
    			0,
    			17
    		],
    		[
    			0,
    			12
    		],
    		[
    			-1,
    			15
    		],
    		[
    			1,
    			24
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-3,
    			7
    		],
    		[
    			-1,
    			13
    		],
    		[
    			0,
    			8
    		],
    		[
    			-4,
    			13
    		],
    		[
    			1,
    			9
    		],
    		[
    			4,
    			4
    		],
    		[
    			5,
    			-6
    		],
    		[
    			2,
    			-1
    		],
    		[
    			5,
    			-8
    		],
    		[
    			3,
    			-3
    		],
    		[
    			1,
    			2
    		],
    		[
    			6,
    			-1
    		],
    		[
    			3,
    			-12
    		],
    		[
    			1,
    			-13
    		],
    		[
    			0,
    			-9
    		],
    		[
    			1,
    			-4
    		],
    		[
    			3,
    			-2
    		],
    		[
    			1,
    			-7
    		],
    		[
    			1,
    			-8
    		],
    		[
    			3,
    			-8
    		],
    		[
    			1,
    			-11
    		],
    		[
    			1,
    			-1
    		]
    	],
    	[
    		[
    			1239,
    			7157
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-3,
    			12
    		],
    		[
    			-1,
    			13
    		],
    		[
    			-3,
    			15
    		],
    		[
    			-1,
    			13
    		],
    		[
    			-2,
    			16
    		],
    		[
    			1,
    			14
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-2,
    			15
    		],
    		[
    			-3,
    			5
    		],
    		[
    			-2,
    			13
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			6
    		],
    		[
    			2,
    			16
    		],
    		[
    			1,
    			4
    		],
    		[
    			-2,
    			7
    		],
    		[
    			0,
    			5
    		],
    		[
    			2,
    			5
    		],
    		[
    			0,
    			7
    		],
    		[
    			-2,
    			10
    		],
    		[
    			-1,
    			13
    		],
    		[
    			2,
    			6
    		],
    		[
    			0,
    			9
    		],
    		[
    			-3,
    			2
    		],
    		[
    			-3,
    			-5
    		],
    		[
    			-1,
    			13
    		],
    		[
    			-2,
    			7
    		],
    		[
    			0,
    			5
    		],
    		[
    			3,
    			12
    		],
    		[
    			1,
    			4
    		],
    		[
    			0,
    			11
    		],
    		[
    			3,
    			10
    		],
    		[
    			2,
    			-2
    		],
    		[
    			2,
    			-8
    		],
    		[
    			0,
    			-5
    		],
    		[
    			2,
    			1
    		],
    		[
    			2,
    			-9
    		],
    		[
    			2,
    			-4
    		],
    		[
    			4,
    			1
    		],
    		[
    			2,
    			-3
    		],
    		[
    			1,
    			-12
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			2,
    			-4
    		],
    		[
    			1,
    			-8
    		],
    		[
    			3,
    			-44
    		],
    		[
    			0,
    			-12
    		],
    		[
    			1,
    			-9
    		],
    		[
    			0,
    			-9
    		],
    		[
    			1,
    			-5
    		],
    		[
    			1,
    			-18
    		],
    		[
    			1,
    			-17
    		],
    		[
    			-1,
    			-16
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			1,
    			-13
    		],
    		[
    			0,
    			-13
    		],
    		[
    			0,
    			-26
    		],
    		[
    			-1,
    			-18
    		]
    	],
    	[
    		[
    			1213,
    			7481
    		],
    		[
    			4,
    			-12
    		],
    		[
    			2,
    			-6
    		],
    		[
    			2,
    			-10
    		],
    		[
    			3,
    			-4
    		],
    		[
    			3,
    			5
    		],
    		[
    			2,
    			-2
    		],
    		[
    			1,
    			4
    		],
    		[
    			2,
    			-4
    		],
    		[
    			0,
    			-12
    		],
    		[
    			2,
    			-11
    		],
    		[
    			1,
    			-23
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-4,
    			-1
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-3,
    			9
    		],
    		[
    			-6,
    			16
    		],
    		[
    			-3,
    			8
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			2,
    			-5
    		],
    		[
    			2,
    			-22
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-5,
    			3
    		],
    		[
    			-1,
    			3
    		],
    		[
    			0,
    			6
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-3,
    			11
    		],
    		[
    			1,
    			5
    		],
    		[
    			-2,
    			9
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-3,
    			23
    		],
    		[
    			0,
    			4
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-3,
    			5
    		],
    		[
    			0,
    			7
    		],
    		[
    			-3,
    			6
    		],
    		[
    			1,
    			28
    		],
    		[
    			2,
    			4
    		],
    		[
    			1,
    			7
    		],
    		[
    			2,
    			3
    		],
    		[
    			0,
    			8
    		],
    		[
    			-1,
    			15
    		],
    		[
    			3,
    			-1
    		],
    		[
    			0,
    			-8
    		],
    		[
    			1,
    			-10
    		],
    		[
    			1,
    			2
    		],
    		[
    			2,
    			8
    		],
    		[
    			3,
    			-1
    		],
    		[
    			2,
    			-3
    		],
    		[
    			1,
    			8
    		],
    		[
    			3,
    			7
    		],
    		[
    			1,
    			1
    		],
    		[
    			1,
    			-9
    		],
    		[
    			4,
    			-5
    		],
    		[
    			3,
    			-9
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			-3,
    			-12
    		],
    		[
    			0,
    			-8
    		],
    		[
    			1,
    			-1
    		],
    		[
    			1,
    			10
    		],
    		[
    			2,
    			8
    		],
    		[
    			1,
    			9
    		],
    		[
    			2,
    			2
    		],
    		[
    			3,
    			-9
    		],
    		[
    			5,
    			-2
    		],
    		[
    			1,
    			-5
    		],
    		[
    			3,
    			-2
    		],
    		[
    			1,
    			-5
    		],
    		[
    			0,
    			-8
    		],
    		[
    			0,
    			-11
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-4,
    			8
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			3,
    			-6
    		],
    		[
    			3,
    			-10
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-5,
    			-1
    		],
    		[
    			-3,
    			5
    		],
    		[
    			-2,
    			9
    		],
    		[
    			-3,
    			6
    		],
    		[
    			-3,
    			3
    		]
    	],
    	[
    		[
    			1216,
    			7339
    		],
    		[
    			-1,
    			3
    		],
    		[
    			0,
    			10
    		],
    		[
    			1,
    			5
    		],
    		[
    			3,
    			0
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-3,
    			-12
    		]
    	],
    	[
    		[
    			1210,
    			7373
    		],
    		[
    			2,
    			-4
    		],
    		[
    			2,
    			-11
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			0,
    			-12
    		],
    		[
    			1,
    			-3
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-2,
    			-13
    		],
    		[
    			-6,
    			-5
    		],
    		[
    			1,
    			18
    		],
    		[
    			2,
    			5
    		],
    		[
    			0,
    			7
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			9
    		],
    		[
    			0,
    			8
    		],
    		[
    			1,
    			14
    		],
    		[
    			2,
    			1
    		],
    		[
    			1,
    			-4
    		]
    	],
    	[
    		[
    			461,
    			8487
    		],
    		[
    			5,
    			19
    		],
    		[
    			0,
    			6
    		],
    		[
    			2,
    			9
    		],
    		[
    			2,
    			6
    		],
    		[
    			-1,
    			10
    		],
    		[
    			2,
    			0
    		],
    		[
    			4,
    			-6
    		],
    		[
    			2,
    			-4
    		],
    		[
    			0,
    			-8
    		],
    		[
    			5,
    			0
    		],
    		[
    			5,
    			4
    		],
    		[
    			2,
    			-3
    		],
    		[
    			8,
    			4
    		],
    		[
    			5,
    			6
    		],
    		[
    			1,
    			8
    		],
    		[
    			5,
    			21
    		],
    		[
    			4,
    			21
    		],
    		[
    			0,
    			12
    		],
    		[
    			-2,
    			22
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-2,
    			20
    		],
    		[
    			0,
    			19
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-7,
    			25
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-4,
    			5
    		],
    		[
    			-3,
    			0
    		],
    		[
    			1,
    			16
    		],
    		[
    			3,
    			5
    		],
    		[
    			4,
    			-6
    		],
    		[
    			6,
    			-1
    		],
    		[
    			-1,
    			8
    		],
    		[
    			3,
    			2
    		],
    		[
    			4,
    			11
    		],
    		[
    			1,
    			20
    		],
    		[
    			-5,
    			20
    		],
    		[
    			-4,
    			9
    		],
    		[
    			-3,
    			9
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-3,
    			-5
    		],
    		[
    			-2,
    			-15
    		],
    		[
    			-4,
    			-4
    		],
    		[
    			-4,
    			7
    		],
    		[
    			-6,
    			-15
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-6,
    			-4
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-3,
    			-5
    		],
    		[
    			-5,
    			-12
    		],
    		[
    			-2,
    			-11
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-3,
    			-1
    		],
    		[
    			0,
    			10
    		],
    		[
    			-1,
    			13
    		],
    		[
    			0,
    			4
    		],
    		[
    			-3,
    			8
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-4,
    			8
    		],
    		[
    			-3,
    			-8
    		],
    		[
    			2,
    			-7
    		],
    		[
    			2,
    			-1
    		],
    		[
    			2,
    			-7
    		],
    		[
    			2,
    			2
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-2,
    			-13
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-2,
    			5
    		],
    		[
    			0,
    			8
    		],
    		[
    			-6,
    			12
    		],
    		[
    			-4,
    			5
    		],
    		[
    			-6,
    			2
    		],
    		[
    			-4,
    			-4
    		],
    		[
    			-5,
    			3
    		],
    		[
    			-5,
    			-1
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			-11,
    			-18
    		],
    		[
    			-5,
    			-3
    		],
    		[
    			-6,
    			7
    		],
    		[
    			-5,
    			5
    		],
    		[
    			-10,
    			7
    		],
    		[
    			-4,
    			3
    		],
    		[
    			-9,
    			6
    		],
    		[
    			-5,
    			10
    		],
    		[
    			-2,
    			18
    		],
    		[
    			0,
    			12
    		],
    		[
    			2,
    			7
    		],
    		[
    			0,
    			7
    		],
    		[
    			-4,
    			12
    		],
    		[
    			-4,
    			9
    		],
    		[
    			0,
    			10
    		],
    		[
    			-5,
    			10
    		],
    		[
    			-1,
    			7
    		],
    		[
    			4,
    			-3
    		],
    		[
    			3,
    			0
    		],
    		[
    			1,
    			4
    		],
    		[
    			3,
    			3
    		],
    		[
    			1,
    			5
    		],
    		[
    			0,
    			9
    		],
    		[
    			4,
    			10
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-3,
    			6
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-3,
    			-2
    		],
    		[
    			-4,
    			2
    		],
    		[
    			-6,
    			9
    		],
    		[
    			-11,
    			3
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-6,
    			16
    		],
    		[
    			-6,
    			10
    		],
    		[
    			-5,
    			5
    		],
    		[
    			-1,
    			9
    		],
    		[
    			1,
    			11
    		],
    		[
    			3,
    			8
    		],
    		[
    			7,
    			9
    		],
    		[
    			5,
    			9
    		],
    		[
    			7,
    			12
    		],
    		[
    			5,
    			11
    		],
    		[
    			4,
    			9
    		],
    		[
    			4,
    			11
    		],
    		[
    			9,
    			17
    		],
    		[
    			5,
    			9
    		],
    		[
    			15,
    			27
    		],
    		[
    			11,
    			16
    		],
    		[
    			8,
    			10
    		],
    		[
    			11,
    			13
    		],
    		[
    			9,
    			7
    		],
    		[
    			12,
    			2
    		],
    		[
    			2,
    			-7
    		],
    		[
    			4,
    			-1
    		],
    		[
    			1,
    			-6
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			-3,
    			-6
    		],
    		[
    			0,
    			-6
    		],
    		[
    			0,
    			-11
    		],
    		[
    			1,
    			-11
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			-5,
    			-5
    		],
    		[
    			2,
    			-4
    		],
    		[
    			2,
    			2
    		],
    		[
    			2,
    			-13
    		],
    		[
    			2,
    			-7
    		],
    		[
    			0,
    			-4
    		],
    		[
    			4,
    			-1
    		],
    		[
    			4,
    			5
    		],
    		[
    			4,
    			0
    		],
    		[
    			5,
    			-5
    		],
    		[
    			5,
    			4
    		],
    		[
    			7,
    			2
    		],
    		[
    			3,
    			-9
    		],
    		[
    			5,
    			3
    		],
    		[
    			2,
    			-5
    		],
    		[
    			1,
    			0
    		],
    		[
    			6,
    			7
    		],
    		[
    			3,
    			-1
    		],
    		[
    			5,
    			-8
    		],
    		[
    			2,
    			10
    		],
    		[
    			3,
    			7
    		],
    		[
    			1,
    			8
    		],
    		[
    			2,
    			16
    		],
    		[
    			2,
    			4
    		],
    		[
    			4,
    			-1
    		],
    		[
    			1,
    			-6
    		],
    		[
    			3,
    			-2
    		],
    		[
    			6,
    			8
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-2,
    			10
    		],
    		[
    			-6,
    			8
    		],
    		[
    			-5,
    			3
    		],
    		[
    			-5,
    			0
    		],
    		[
    			-3,
    			-6
    		],
    		[
    			-3,
    			-2
    		],
    		[
    			2,
    			17
    		],
    		[
    			-1,
    			13
    		],
    		[
    			-4,
    			14
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-2,
    			15
    		],
    		[
    			-3,
    			6
    		],
    		[
    			-6,
    			4
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-3,
    			13
    		],
    		[
    			1,
    			9
    		],
    		[
    			3,
    			4
    		],
    		[
    			4,
    			3
    		],
    		[
    			2,
    			-3
    		],
    		[
    			1,
    			-10
    		],
    		[
    			4,
    			-14
    		],
    		[
    			2,
    			-6
    		],
    		[
    			-2,
    			-12
    		],
    		[
    			1,
    			-9
    		],
    		[
    			3,
    			-8
    		],
    		[
    			1,
    			-10
    		],
    		[
    			8,
    			-19
    		],
    		[
    			2,
    			-2
    		],
    		[
    			3,
    			3
    		],
    		[
    			3,
    			5
    		],
    		[
    			1,
    			8
    		],
    		[
    			-5,
    			1
    		],
    		[
    			0,
    			6
    		],
    		[
    			-6,
    			11
    		],
    		[
    			-5,
    			18
    		],
    		[
    			1,
    			15
    		],
    		[
    			2,
    			12
    		],
    		[
    			3,
    			19
    		],
    		[
    			3,
    			-5
    		],
    		[
    			2,
    			1
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-3,
    			4
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-3,
    			8
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-7,
    			-5
    		],
    		[
    			-3,
    			-6
    		],
    		[
    			-6,
    			-1
    		],
    		[
    			0,
    			7
    		],
    		[
    			-5,
    			-3
    		],
    		[
    			-2,
    			9
    		],
    		[
    			-4,
    			-4
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-6,
    			6
    		],
    		[
    			-13,
    			10
    		],
    		[
    			-5,
    			7
    		],
    		[
    			0,
    			15
    		],
    		[
    			0,
    			8
    		],
    		[
    			-4,
    			30
    		],
    		[
    			-3,
    			23
    		],
    		[
    			-2,
    			9
    		],
    		[
    			-4,
    			10
    		],
    		[
    			-9,
    			16
    		],
    		[
    			-7,
    			18
    		],
    		[
    			-11,
    			27
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-7,
    			12
    		],
    		[
    			-8,
    			4
    		],
    		[
    			-5,
    			7
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-7,
    			18
    		],
    		[
    			-3,
    			7
    		],
    		[
    			-9,
    			11
    		],
    		[
    			0,
    			6
    		],
    		[
    			9,
    			10
    		],
    		[
    			2,
    			7
    		],
    		[
    			0,
    			9
    		],
    		[
    			2,
    			10
    		],
    		[
    			1,
    			22
    		],
    		[
    			0,
    			18
    		],
    		[
    			-1,
    			19
    		],
    		[
    			16,
    			-4
    		],
    		[
    			9,
    			0
    		],
    		[
    			14,
    			7
    		],
    		[
    			5,
    			3
    		],
    		[
    			11,
    			4
    		],
    		[
    			8,
    			10
    		],
    		[
    			4,
    			10
    		],
    		[
    			3,
    			5
    		],
    		[
    			5,
    			14
    		],
    		[
    			2,
    			10
    		],
    		[
    			5,
    			15
    		],
    		[
    			1,
    			2
    		],
    		[
    			4,
    			17
    		],
    		[
    			0,
    			7
    		],
    		[
    			2,
    			23
    		],
    		[
    			-2,
    			10
    		],
    		[
    			2,
    			4
    		],
    		[
    			3,
    			15
    		],
    		[
    			-3,
    			7
    		],
    		[
    			0,
    			5
    		],
    		[
    			3,
    			8
    		],
    		[
    			2,
    			3
    		],
    		[
    			10,
    			30
    		],
    		[
    			1,
    			13
    		],
    		[
    			2,
    			0
    		],
    		[
    			2,
    			12
    		],
    		[
    			4,
    			10
    		],
    		[
    			4,
    			12
    		],
    		[
    			3,
    			12
    		],
    		[
    			6,
    			-4
    		],
    		[
    			2,
    			-5
    		],
    		[
    			7,
    			0
    		],
    		[
    			3,
    			3
    		],
    		[
    			7,
    			13
    		],
    		[
    			1,
    			-2
    		],
    		[
    			7,
    			11
    		],
    		[
    			7,
    			15
    		],
    		[
    			0,
    			2
    		],
    		[
    			7,
    			17
    		],
    		[
    			5,
    			14
    		],
    		[
    			7,
    			19
    		],
    		[
    			4,
    			12
    		],
    		[
    			4,
    			4
    		],
    		[
    			8,
    			10
    		],
    		[
    			2,
    			-2
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-5,
    			-2
    		],
    		[
    			1,
    			-9
    		],
    		[
    			8,
    			1
    		],
    		[
    			1,
    			6
    		],
    		[
    			9,
    			-2
    		],
    		[
    			7,
    			3
    		],
    		[
    			0,
    			4
    		],
    		[
    			4,
    			-1
    		],
    		[
    			6,
    			3
    		],
    		[
    			8,
    			8
    		],
    		[
    			7,
    			13
    		],
    		[
    			7,
    			20
    		],
    		[
    			4,
    			14
    		],
    		[
    			8,
    			30
    		],
    		[
    			7,
    			12
    		],
    		[
    			1,
    			-11
    		],
    		[
    			5,
    			-6
    		],
    		[
    			4,
    			0
    		],
    		[
    			4,
    			-4
    		],
    		[
    			1,
    			-7
    		],
    		[
    			2,
    			-3
    		],
    		[
    			6,
    			1
    		],
    		[
    			4,
    			-4
    		],
    		[
    			2,
    			-14
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-4,
    			-7
    		],
    		[
    			-3,
    			-10
    		],
    		[
    			-5,
    			-1
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			2,
    			-7
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			3,
    			4
    		],
    		[
    			7,
    			-1
    		],
    		[
    			4,
    			7
    		],
    		[
    			0,
    			15
    		],
    		[
    			4,
    			12
    		],
    		[
    			5,
    			4
    		],
    		[
    			-3,
    			7
    		],
    		[
    			1,
    			3
    		],
    		[
    			6,
    			12
    		],
    		[
    			7,
    			-11
    		],
    		[
    			4,
    			-11
    		],
    		[
    			2,
    			-7
    		],
    		[
    			-3,
    			-16
    		],
    		[
    			1,
    			-6
    		],
    		[
    			3,
    			-9
    		],
    		[
    			5,
    			2
    		],
    		[
    			2,
    			-4
    		],
    		[
    			3,
    			-8
    		],
    		[
    			5,
    			10
    		],
    		[
    			3,
    			12
    		],
    		[
    			4,
    			1
    		],
    		[
    			6,
    			-1
    		],
    		[
    			3,
    			0
    		],
    		[
    			5,
    			7
    		],
    		[
    			3,
    			0
    		],
    		[
    			3,
    			-4
    		],
    		[
    			7,
    			-3
    		],
    		[
    			5,
    			0
    		],
    		[
    			9,
    			-8
    		],
    		[
    			2,
    			-8
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			-2,
    			-13
    		],
    		[
    			-3,
    			-5
    		],
    		[
    			2,
    			-15
    		],
    		[
    			2,
    			1
    		],
    		[
    			2,
    			-4
    		],
    		[
    			3,
    			-1
    		],
    		[
    			9,
    			-8
    		],
    		[
    			3,
    			-9
    		],
    		[
    			-5,
    			-5
    		],
    		[
    			1,
    			-8
    		],
    		[
    			9,
    			1
    		],
    		[
    			3,
    			-2
    		],
    		[
    			7,
    			-7
    		],
    		[
    			0,
    			8
    		],
    		[
    			3,
    			-2
    		],
    		[
    			1,
    			4
    		],
    		[
    			6,
    			4
    		],
    		[
    			2,
    			7
    		],
    		[
    			11,
    			-1
    		],
    		[
    			0,
    			-11
    		],
    		[
    			3,
    			2
    		],
    		[
    			4,
    			-2
    		],
    		[
    			7,
    			14
    		],
    		[
    			1,
    			-3
    		],
    		[
    			4,
    			3
    		],
    		[
    			3,
    			-2
    		],
    		[
    			3,
    			4
    		],
    		[
    			1,
    			-5
    		],
    		[
    			7,
    			-1
    		],
    		[
    			6,
    			-12
    		],
    		[
    			3,
    			0
    		],
    		[
    			2,
    			-4
    		],
    		[
    			2,
    			5
    		],
    		[
    			3,
    			-1
    		],
    		[
    			3,
    			-12
    		],
    		[
    			0,
    			-7
    		],
    		[
    			4,
    			-3
    		],
    		[
    			4,
    			8
    		],
    		[
    			7,
    			-6
    		],
    		[
    			4,
    			-7
    		],
    		[
    			1,
    			-11
    		],
    		[
    			3,
    			-4
    		],
    		[
    			4,
    			0
    		],
    		[
    			5,
    			-2
    		],
    		[
    			3,
    			6
    		],
    		[
    			0,
    			-8
    		],
    		[
    			2,
    			-4
    		],
    		[
    			5,
    			-2
    		],
    		[
    			3,
    			8
    		],
    		[
    			4,
    			-2
    		],
    		[
    			6,
    			2
    		],
    		[
    			7,
    			-2
    		],
    		[
    			5,
    			-6
    		],
    		[
    			2,
    			-1
    		],
    		[
    			6,
    			2
    		],
    		[
    			1,
    			-5
    		],
    		[
    			4,
    			-7
    		],
    		[
    			3,
    			-2
    		],
    		[
    			3,
    			-8
    		],
    		[
    			4,
    			-3
    		],
    		[
    			2,
    			-4
    		],
    		[
    			5,
    			-3
    		],
    		[
    			2,
    			-4
    		],
    		[
    			2,
    			3
    		],
    		[
    			7,
    			-1
    		],
    		[
    			4,
    			11
    		],
    		[
    			7,
    			2
    		],
    		[
    			4,
    			4
    		],
    		[
    			5,
    			13
    		],
    		[
    			8,
    			3
    		],
    		[
    			3,
    			-1
    		],
    		[
    			0,
    			-9
    		],
    		[
    			4,
    			1
    		],
    		[
    			3,
    			4
    		],
    		[
    			4,
    			-8
    		],
    		[
    			2,
    			3
    		],
    		[
    			8,
    			-9
    		],
    		[
    			7,
    			-13
    		],
    		[
    			3,
    			-11
    		],
    		[
    			3,
    			-2
    		],
    		[
    			6,
    			-10
    		],
    		[
    			2,
    			-9
    		],
    		[
    			4,
    			2
    		],
    		[
    			4,
    			-5
    		],
    		[
    			5,
    			-10
    		],
    		[
    			3,
    			-7
    		],
    		[
    			0,
    			-6
    		],
    		[
    			1,
    			-6
    		],
    		[
    			4,
    			0
    		],
    		[
    			1,
    			10
    		],
    		[
    			6,
    			-7
    		],
    		[
    			0,
    			-215
    		],
    		[
    			0,
    			-498
    		],
    		[
    			0,
    			-695
    		],
    		[
    			0,
    			-84
    		],
    		[
    			0,
    			-241
    		],
    		[
    			0,
    			-16
    		],
    		[
    			13,
    			-15
    		],
    		[
    			1,
    			16
    		],
    		[
    			14,
    			-23
    		],
    		[
    			8,
    			29
    		],
    		[
    			17,
    			3
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-3,
    			-44
    		],
    		[
    			5,
    			-18
    		],
    		[
    			6,
    			-12
    		],
    		[
    			3,
    			-4
    		],
    		[
    			1,
    			-18
    		],
    		[
    			1,
    			-8
    		],
    		[
    			17,
    			-59
    		],
    		[
    			11,
    			-39
    		],
    		[
    			3,
    			-48
    		],
    		[
    			-1,
    			-15
    		],
    		[
    			3,
    			0
    		],
    		[
    			5,
    			17
    		],
    		[
    			11,
    			26
    		],
    		[
    			1,
    			4
    		],
    		[
    			7,
    			1
    		],
    		[
    			3,
    			22
    		],
    		[
    			0,
    			34
    		],
    		[
    			3,
    			-3
    		],
    		[
    			2,
    			3
    		],
    		[
    			1,
    			11
    		],
    		[
    			0,
    			13
    		],
    		[
    			0,
    			6
    		],
    		[
    			2,
    			3
    		],
    		[
    			7,
    			4
    		],
    		[
    			13,
    			26
    		],
    		[
    			6,
    			-19
    		],
    		[
    			3,
    			-14
    		],
    		[
    			1,
    			0
    		],
    		[
    			2,
    			-11
    		],
    		[
    			0,
    			-17
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			0,
    			-6
    		],
    		[
    			1,
    			-5
    		],
    		[
    			0,
    			-9
    		],
    		[
    			2,
    			-13
    		],
    		[
    			7,
    			-6
    		],
    		[
    			1,
    			-10
    		],
    		[
    			3,
    			-12
    		],
    		[
    			2,
    			0
    		],
    		[
    			3,
    			-17
    		],
    		[
    			0,
    			-11
    		],
    		[
    			2,
    			-4
    		],
    		[
    			0,
    			-7
    		],
    		[
    			2,
    			-12
    		],
    		[
    			11,
    			-24
    		],
    		[
    			4,
    			-22
    		],
    		[
    			4,
    			-16
    		],
    		[
    			5,
    			-18
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			3,
    			-21
    		],
    		[
    			5,
    			-23
    		],
    		[
    			2,
    			-28
    		],
    		[
    			6,
    			-30
    		],
    		[
    			3,
    			-25
    		],
    		[
    			3,
    			-16
    		],
    		[
    			3,
    			-22
    		],
    		[
    			5,
    			-29
    		],
    		[
    			3,
    			-25
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			-2,
    			-12
    		],
    		[
    			4,
    			-7
    		],
    		[
    			5,
    			-2
    		],
    		[
    			-1,
    			-21
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			1,
    			-4
    		],
    		[
    			4,
    			-3
    		],
    		[
    			2,
    			-6
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			1,
    			-9
    		],
    		[
    			1,
    			-19
    		],
    		[
    			7,
    			2
    		],
    		[
    			3,
    			-12
    		],
    		[
    			9,
    			-19
    		],
    		[
    			2,
    			-7
    		],
    		[
    			8,
    			-8
    		],
    		[
    			5,
    			-18
    		],
    		[
    			4,
    			-6
    		],
    		[
    			1,
    			-18
    		],
    		[
    			3,
    			-3
    		],
    		[
    			2,
    			-5
    		],
    		[
    			4,
    			3
    		],
    		[
    			3,
    			-18
    		],
    		[
    			-1,
    			-19
    		],
    		[
    			-1,
    			-17
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			0,
    			-10
    		],
    		[
    			1,
    			-6
    		],
    		[
    			0,
    			-19
    		],
    		[
    			1,
    			-17
    		],
    		[
    			1,
    			-7
    		],
    		[
    			1,
    			-21
    		],
    		[
    			1,
    			-10
    		],
    		[
    			-4,
    			-17
    		],
    		[
    			-2,
    			-19
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-3,
    			-17
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-4,
    			-16
    		],
    		[
    			-3,
    			-9
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			1,
    			-7
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-1,
    			10
    		],
    		[
    			-1,
    			17
    		],
    		[
    			1,
    			6
    		],
    		[
    			-2,
    			6
    		],
    		[
    			1,
    			13
    		],
    		[
    			-2,
    			9
    		],
    		[
    			-1,
    			14
    		],
    		[
    			3,
    			11
    		],
    		[
    			1,
    			10
    		],
    		[
    			2,
    			-2
    		],
    		[
    			0,
    			13
    		],
    		[
    			-1,
    			13
    		],
    		[
    			1,
    			19
    		],
    		[
    			-1,
    			31
    		],
    		[
    			-1,
    			11
    		],
    		[
    			-4,
    			26
    		],
    		[
    			-2,
    			1
    		],
    		[
    			2,
    			-14
    		],
    		[
    			1,
    			-12
    		],
    		[
    			2,
    			-14
    		],
    		[
    			1,
    			-21
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			1,
    			-15
    		],
    		[
    			1,
    			-10
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			12
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			1,
    			-6
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			-3,
    			-17
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-2,
    			8
    		],
    		[
    			2,
    			12
    		],
    		[
    			1,
    			12
    		],
    		[
    			0,
    			6
    		],
    		[
    			-3,
    			-2
    		],
    		[
    			1,
    			-11
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-3,
    			-9
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			18
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			-2,
    			9
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-3,
    			11
    		],
    		[
    			0,
    			12
    		],
    		[
    			3,
    			5
    		],
    		[
    			2,
    			6
    		],
    		[
    			-2,
    			11
    		],
    		[
    			1,
    			11
    		],
    		[
    			-1,
    			6
    		],
    		[
    			2,
    			7
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-1,
    			20
    		],
    		[
    			-3,
    			-4
    		],
    		[
    			1,
    			-7
    		],
    		[
    			1,
    			-5
    		],
    		[
    			-2,
    			-17
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-2,
    			-12
    		],
    		[
    			-2,
    			3
    		],
    		[
    			1,
    			-15
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-2,
    			8
    		],
    		[
    			-3,
    			4
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-1,
    			22
    		],
    		[
    			-1,
    			5
    		],
    		[
    			2,
    			4
    		],
    		[
    			0,
    			9
    		],
    		[
    			2,
    			2
    		],
    		[
    			1,
    			4
    		],
    		[
    			1,
    			24
    		],
    		[
    			-1,
    			16
    		],
    		[
    			3,
    			13
    		],
    		[
    			1,
    			12
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-2,
    			-10
    		],
    		[
    			1,
    			-18
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-3,
    			0
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			13
    		],
    		[
    			-1,
    			13
    		],
    		[
    			-2,
    			11
    		],
    		[
    			-3,
    			-4
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-2,
    			15
    		],
    		[
    			-1,
    			6
    		],
    		[
    			0,
    			13
    		],
    		[
    			1,
    			4
    		],
    		[
    			3,
    			0
    		],
    		[
    			0,
    			11
    		],
    		[
    			2,
    			8
    		],
    		[
    			2,
    			3
    		],
    		[
    			2,
    			-8
    		],
    		[
    			1,
    			5
    		],
    		[
    			-2,
    			27
    		],
    		[
    			1,
    			1
    		],
    		[
    			3,
    			-7
    		],
    		[
    			1,
    			-10
    		],
    		[
    			1,
    			0
    		],
    		[
    			0,
    			11
    		],
    		[
    			-3,
    			6
    		],
    		[
    			-2,
    			8
    		],
    		[
    			0,
    			12
    		],
    		[
    			3,
    			8
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-4,
    			-1
    		],
    		[
    			-2,
    			6
    		],
    		[
    			0,
    			5
    		],
    		[
    			4,
    			16
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-3,
    			-12
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-4,
    			10
    		],
    		[
    			-1,
    			11
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-1,
    			13
    		],
    		[
    			2,
    			2
    		],
    		[
    			1,
    			4
    		],
    		[
    			-1,
    			10
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			-3,
    			3
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-3,
    			1
    		],
    		[
    			0,
    			7
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-6,
    			12
    		],
    		[
    			-1,
    			12
    		],
    		[
    			2,
    			12
    		],
    		[
    			2,
    			-4
    		],
    		[
    			3,
    			1
    		],
    		[
    			1,
    			8
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-3,
    			4
    		],
    		[
    			0,
    			8
    		],
    		[
    			-2,
    			17
    		],
    		[
    			0,
    			17
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-1,
    			9
    		],
    		[
    			0,
    			16
    		],
    		[
    			2,
    			1
    		],
    		[
    			2,
    			-6
    		],
    		[
    			3,
    			-4
    		],
    		[
    			5,
    			-10
    		],
    		[
    			2,
    			0
    		],
    		[
    			-4,
    			10
    		],
    		[
    			-7,
    			21
    		],
    		[
    			0,
    			16
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-4,
    			27
    		],
    		[
    			-6,
    			23
    		],
    		[
    			-1,
    			23
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-4,
    			-1
    		],
    		[
    			-6,
    			4
    		],
    		[
    			-4,
    			6
    		],
    		[
    			-4,
    			28
    		],
    		[
    			0,
    			18
    		],
    		[
    			-4,
    			22
    		],
    		[
    			-3,
    			23
    		],
    		[
    			-3,
    			21
    		],
    		[
    			-1,
    			29
    		],
    		[
    			-1,
    			14
    		],
    		[
    			-2,
    			22
    		],
    		[
    			-3,
    			19
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			1,
    			-7
    		],
    		[
    			2,
    			-5
    		],
    		[
    			2,
    			-24
    		],
    		[
    			-3,
    			1
    		],
    		[
    			0,
    			-9
    		],
    		[
    			0,
    			-4
    		],
    		[
    			0,
    			-9
    		],
    		[
    			3,
    			-29
    		],
    		[
    			1,
    			-7
    		],
    		[
    			0,
    			-8
    		],
    		[
    			3,
    			-23
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			2,
    			-29
    		],
    		[
    			2,
    			-21
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			0,
    			-18
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-2,
    			7
    		],
    		[
    			-1,
    			10
    		],
    		[
    			-1,
    			14
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-4,
    			8
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-5,
    			-3
    		],
    		[
    			0,
    			13
    		],
    		[
    			-3,
    			3
    		],
    		[
    			0,
    			3
    		],
    		[
    			3,
    			5
    		],
    		[
    			-1,
    			12
    		],
    		[
    			0,
    			9
    		],
    		[
    			-2,
    			17
    		],
    		[
    			0,
    			6
    		],
    		[
    			-2,
    			14
    		],
    		[
    			1,
    			3
    		],
    		[
    			0,
    			15
    		],
    		[
    			-2,
    			2
    		],
    		[
    			0,
    			-11
    		],
    		[
    			-1,
    			-20
    		],
    		[
    			-3,
    			-1
    		],
    		[
    			-4,
    			11
    		],
    		[
    			-3,
    			5
    		],
    		[
    			-1,
    			17
    		],
    		[
    			-3,
    			-8
    		],
    		[
    			-4,
    			9
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			0,
    			-9
    		],
    		[
    			5,
    			-5
    		],
    		[
    			0,
    			1
    		],
    		[
    			5,
    			-7
    		],
    		[
    			3,
    			-11
    		],
    		[
    			3,
    			-17
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			0,
    			-5
    		],
    		[
    			3,
    			7
    		],
    		[
    			1,
    			4
    		],
    		[
    			3,
    			1
    		],
    		[
    			1,
    			-17
    		],
    		[
    			2,
    			-13
    		],
    		[
    			2,
    			-25
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-4,
    			-5
    		],
    		[
    			-1,
    			4
    		],
    		[
    			0,
    			5
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			1,
    			-7
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-4,
    			4
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			0,
    			-9
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-2,
    			2
    		],
    		[
    			0,
    			12
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-4,
    			19
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			-2,
    			7
    		],
    		[
    			-3,
    			6
    		],
    		[
    			-6,
    			18
    		],
    		[
    			-5,
    			12
    		],
    		[
    			0,
    			8
    		],
    		[
    			-3,
    			12
    		],
    		[
    			-4,
    			10
    		],
    		[
    			0,
    			16
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-4,
    			15
    		],
    		[
    			0,
    			6
    		],
    		[
    			-4,
    			5
    		],
    		[
    			-10,
    			15
    		],
    		[
    			-4,
    			12
    		],
    		[
    			-4,
    			11
    		],
    		[
    			-10,
    			16
    		],
    		[
    			-4,
    			8
    		],
    		[
    			-9,
    			23
    		],
    		[
    			-3,
    			6
    		],
    		[
    			0,
    			5
    		],
    		[
    			3,
    			15
    		],
    		[
    			2,
    			-2
    		],
    		[
    			2,
    			2
    		],
    		[
    			2,
    			12
    		],
    		[
    			-2,
    			1
    		],
    		[
    			0,
    			12
    		],
    		[
    			-1,
    			19
    		],
    		[
    			1,
    			5
    		],
    		[
    			2,
    			7
    		],
    		[
    			1,
    			10
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			-16
    		],
    		[
    			-3,
    			-4
    		],
    		[
    			-3,
    			-20
    		],
    		[
    			-10,
    			-17
    		],
    		[
    			-3,
    			-7
    		],
    		[
    			-3,
    			0
    		],
    		[
    			-10,
    			4
    		],
    		[
    			-5,
    			5
    		],
    		[
    			-7,
    			12
    		],
    		[
    			-7,
    			12
    		],
    		[
    			0,
    			8
    		],
    		[
    			3,
    			3
    		],
    		[
    			1,
    			15
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			-6,
    			-8
    		],
    		[
    			-4,
    			0
    		],
    		[
    			-5,
    			9
    		],
    		[
    			-6,
    			4
    		],
    		[
    			-3,
    			4
    		],
    		[
    			-8,
    			6
    		],
    		[
    			-5,
    			2
    		],
    		[
    			-5,
    			-1
    		],
    		[
    			-5,
    			-4
    		],
    		[
    			-10,
    			-3
    		],
    		[
    			-7,
    			-5
    		],
    		[
    			-6,
    			-7
    		],
    		[
    			-4,
    			6
    		],
    		[
    			-4,
    			-4
    		],
    		[
    			-7,
    			-20
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-4,
    			-14
    		],
    		[
    			0,
    			10
    		],
    		[
    			4,
    			17
    		],
    		[
    			6,
    			19
    		],
    		[
    			5,
    			0
    		],
    		[
    			0,
    			3
    		],
    		[
    			-2,
    			8
    		],
    		[
    			-5,
    			7
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-3,
    			0
    		],
    		[
    			-3,
    			5
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-2,
    			5
    		],
    		[
    			0,
    			7
    		],
    		[
    			-4,
    			9
    		],
    		[
    			-4,
    			-1
    		],
    		[
    			1,
    			14
    		],
    		[
    			2,
    			15
    		],
    		[
    			-5,
    			1
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			0,
    			-7
    		],
    		[
    			1,
    			-8
    		],
    		[
    			-2,
    			-10
    		],
    		[
    			-4,
    			1
    		],
    		[
    			-7,
    			16
    		],
    		[
    			0,
    			5
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-4,
    			4
    		],
    		[
    			-3,
    			-5
    		],
    		[
    			-3,
    			1
    		],
    		[
    			1,
    			7
    		],
    		[
    			3,
    			6
    		],
    		[
    			2,
    			11
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			-8,
    			-15
    		],
    		[
    			-3,
    			-4
    		],
    		[
    			-3,
    			1
    		],
    		[
    			0,
    			-8
    		],
    		[
    			6,
    			4
    		],
    		[
    			1,
    			-4
    		],
    		[
    			-3,
    			-9
    		],
    		[
    			-3,
    			-2
    		],
    		[
    			-5,
    			-11
    		],
    		[
    			-3,
    			-10
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-1,
    			7
    		],
    		[
    			3,
    			7
    		],
    		[
    			1,
    			7
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			-2,
    			2
    		],
    		[
    			0,
    			8
    		],
    		[
    			3,
    			14
    		],
    		[
    			1,
    			4
    		],
    		[
    			2,
    			0
    		],
    		[
    			2,
    			-5
    		],
    		[
    			2,
    			3
    		],
    		[
    			2,
    			7
    		],
    		[
    			4,
    			2
    		],
    		[
    			6,
    			9
    		],
    		[
    			4,
    			3
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-3,
    			3
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			0,
    			10
    		],
    		[
    			-4,
    			-7
    		],
    		[
    			-3,
    			-1
    		],
    		[
    			0,
    			4
    		],
    		[
    			4,
    			12
    		],
    		[
    			2,
    			6
    		],
    		[
    			0,
    			7
    		],
    		[
    			-3,
    			-10
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			-4,
    			3
    		],
    		[
    			-1,
    			9
    		],
    		[
    			3,
    			3
    		],
    		[
    			1,
    			-1
    		],
    		[
    			1,
    			4
    		],
    		[
    			4,
    			2
    		],
    		[
    			3,
    			5
    		],
    		[
    			2,
    			7
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-4,
    			0
    		],
    		[
    			-2,
    			11
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-2,
    			-11
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			0,
    			9
    		],
    		[
    			1,
    			5
    		],
    		[
    			1,
    			6
    		],
    		[
    			0,
    			8
    		],
    		[
    			1,
    			6
    		],
    		[
    			2,
    			18
    		],
    		[
    			10,
    			1
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-9,
    			0
    		],
    		[
    			-2,
    			-11
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-3,
    			-12
    		],
    		[
    			-3,
    			-8
    		],
    		[
    			-2,
    			2
    		],
    		[
    			0,
    			9
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-2,
    			5
    		],
    		[
    			0,
    			-11
    		],
    		[
    			-3,
    			-8
    		],
    		[
    			-2,
    			4
    		],
    		[
    			0,
    			8
    		],
    		[
    			-3,
    			-6
    		],
    		[
    			1,
    			21
    		],
    		[
    			1,
    			10
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-2,
    			-21
    		],
    		[
    			1,
    			-18
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			0,
    			8
    		],
    		[
    			-3,
    			5
    		],
    		[
    			0,
    			-7
    		],
    		[
    			1,
    			-11
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-4,
    			3
    		],
    		[
    			0,
    			-3
    		],
    		[
    			-3,
    			-5
    		],
    		[
    			-3,
    			2
    		],
    		[
    			0,
    			6
    		],
    		[
    			2,
    			21
    		],
    		[
    			3,
    			17
    		],
    		[
    			0,
    			8
    		],
    		[
    			5,
    			20
    		],
    		[
    			0,
    			6
    		],
    		[
    			2,
    			7
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-2,
    			-11
    		],
    		[
    			-5,
    			-23
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-3,
    			-9
    		],
    		[
    			-1,
    			13
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			0,
    			-13
    		],
    		[
    			-2,
    			-11
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-2,
    			-11
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			2,
    			-4
    		],
    		[
    			0,
    			-15
    		],
    		[
    			1,
    			-1
    		],
    		[
    			2,
    			13
    		],
    		[
    			1,
    			2
    		],
    		[
    			3,
    			-1
    		],
    		[
    			1,
    			-3
    		],
    		[
    			0,
    			-15
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-3,
    			-5
    		],
    		[
    			-3,
    			-13
    		],
    		[
    			1,
    			-10
    		],
    		[
    			2,
    			4
    		],
    		[
    			1,
    			12
    		],
    		[
    			3,
    			7
    		],
    		[
    			3,
    			-15
    		],
    		[
    			0,
    			-7
    		],
    		[
    			1,
    			-7
    		],
    		[
    			-2,
    			-31
    		],
    		[
    			-3,
    			1
    		],
    		[
    			0,
    			8
    		],
    		[
    			-5,
    			-12
    		],
    		[
    			2,
    			-7
    		],
    		[
    			2,
    			-2
    		],
    		[
    			2,
    			1
    		],
    		[
    			3,
    			-8
    		],
    		[
    			-3,
    			-10
    		],
    		[
    			2,
    			-2
    		],
    		[
    			2,
    			6
    		],
    		[
    			1,
    			-2
    		],
    		[
    			1,
    			-6
    		],
    		[
    			-3,
    			-7
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			1,
    			-2
    		],
    		[
    			3,
    			12
    		],
    		[
    			2,
    			-1
    		],
    		[
    			-2,
    			-10
    		],
    		[
    			-4,
    			-9
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-3,
    			-6
    		],
    		[
    			-2,
    			0
    		],
    		[
    			2,
    			13
    		],
    		[
    			-3,
    			-2
    		],
    		[
    			-1,
    			3
    		],
    		[
    			1,
    			5
    		],
    		[
    			0,
    			18
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-1,
    			-29
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-4,
    			-7
    		],
    		[
    			-2,
    			9
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-3,
    			2
    		],
    		[
    			2,
    			9
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-1,
    			-13
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			15
    		],
    		[
    			-1,
    			17
    		],
    		[
    			-2,
    			2
    		],
    		[
    			0,
    			-17
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-2,
    			-19
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			2,
    			-6
    		],
    		[
    			0,
    			-14
    		],
    		[
    			-3,
    			7
    		],
    		[
    			-1,
    			20
    		],
    		[
    			-1,
    			11
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			0,
    			-24
    		],
    		[
    			1,
    			-7
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			-3,
    			12
    		],
    		[
    			0,
    			7
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-4,
    			5
    		],
    		[
    			1,
    			-7
    		],
    		[
    			2,
    			-6
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-7,
    			-25
    		],
    		[
    			-3,
    			-15
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-3,
    			-7
    		],
    		[
    			-1,
    			3
    		],
    		[
    			3,
    			34
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-2,
    			-18
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-2,
    			21
    		],
    		[
    			-2,
    			-10
    		],
    		[
    			2,
    			-5
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-3,
    			1
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-4,
    			-12
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-4,
    			9
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-5,
    			0
    		],
    		[
    			0,
    			11
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-4,
    			9
    		],
    		[
    			0,
    			11
    		],
    		[
    			0,
    			6
    		],
    		[
    			2,
    			2
    		],
    		[
    			0,
    			12
    		],
    		[
    			7,
    			11
    		],
    		[
    			3,
    			-3
    		],
    		[
    			2,
    			1
    		],
    		[
    			0,
    			6
    		],
    		[
    			1,
    			7
    		],
    		[
    			5,
    			3
    		],
    		[
    			-1,
    			8
    		],
    		[
    			3,
    			-1
    		],
    		[
    			-1,
    			10
    		],
    		[
    			3,
    			4
    		],
    		[
    			0,
    			5
    		],
    		[
    			4,
    			17
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-6,
    			-17
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-4,
    			2
    		],
    		[
    			-5,
    			14
    		],
    		[
    			-1,
    			11
    		],
    		[
    			1,
    			12
    		],
    		[
    			1,
    			6
    		],
    		[
    			1,
    			8
    		],
    		[
    			2,
    			21
    		],
    		[
    			2,
    			13
    		],
    		[
    			2,
    			5
    		],
    		[
    			3,
    			16
    		],
    		[
    			1,
    			10
    		],
    		[
    			1,
    			17
    		],
    		[
    			2,
    			5
    		],
    		[
    			0,
    			24
    		],
    		[
    			1,
    			6
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-1,
    			15
    		],
    		[
    			-1,
    			12
    		],
    		[
    			3,
    			4
    		],
    		[
    			2,
    			7
    		],
    		[
    			4,
    			2
    		],
    		[
    			5,
    			12
    		],
    		[
    			5,
    			16
    		],
    		[
    			3,
    			7
    		],
    		[
    			6,
    			12
    		],
    		[
    			1,
    			-3
    		],
    		[
    			3,
    			-14
    		],
    		[
    			2,
    			-5
    		],
    		[
    			4,
    			0
    		],
    		[
    			3,
    			3
    		],
    		[
    			2,
    			5
    		],
    		[
    			2,
    			0
    		],
    		[
    			4,
    			-7
    		],
    		[
    			2,
    			2
    		],
    		[
    			6,
    			-8
    		],
    		[
    			7,
    			-3
    		],
    		[
    			0,
    			5
    		],
    		[
    			-3,
    			6
    		],
    		[
    			-3,
    			-2
    		],
    		[
    			-5,
    			10
    		],
    		[
    			-3,
    			0
    		],
    		[
    			-4,
    			7
    		],
    		[
    			-2,
    			11
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-6,
    			15
    		],
    		[
    			2,
    			8
    		],
    		[
    			2,
    			2
    		],
    		[
    			3,
    			20
    		],
    		[
    			3,
    			3
    		],
    		[
    			0,
    			9
    		],
    		[
    			8,
    			12
    		],
    		[
    			0,
    			4
    		],
    		[
    			-3,
    			4
    		],
    		[
    			-5,
    			-7
    		],
    		[
    			-3,
    			-11
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-1,
    			-22
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-4,
    			1
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-5,
    			-1
    		],
    		[
    			-3,
    			7
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			-3,
    			-4
    		],
    		[
    			-6,
    			-9
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-2,
    			-18
    		],
    		[
    			-4,
    			-2
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-3,
    			0
    		],
    		[
    			-4,
    			-10
    		],
    		[
    			-5,
    			-19
    		],
    		[
    			0,
    			-8
    		],
    		[
    			3,
    			-15
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-3,
    			5
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-3,
    			-9
    		],
    		[
    			-3,
    			-15
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-3,
    			-12
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			1,
    			-5
    		],
    		[
    			2,
    			-4
    		],
    		[
    			-3,
    			-7
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-3,
    			-10
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-3,
    			-1
    		],
    		[
    			1,
    			-11
    		],
    		[
    			1,
    			-2
    		],
    		[
    			0,
    			-5
    		],
    		[
    			3,
    			-7
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-4,
    			0
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-4,
    			-5
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			3,
    			0
    		],
    		[
    			1,
    			-3
    		],
    		[
    			2,
    			5
    		],
    		[
    			2,
    			0
    		],
    		[
    			1,
    			-8
    		],
    		[
    			-2,
    			-19
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-3,
    			-8
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-2,
    			3
    		],
    		[
    			1,
    			6
    		],
    		[
    			0,
    			12
    		],
    		[
    			-2,
    			6
    		],
    		[
    			0,
    			-14
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-3,
    			-2
    		],
    		[
    			2,
    			-15
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-3,
    			-4
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			2,
    			-3
    		],
    		[
    			-3,
    			-5
    		],
    		[
    			0,
    			-7
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-2,
    			-11
    		],
    		[
    			1,
    			-9
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			1,
    			-10
    		],
    		[
    			3,
    			11
    		],
    		[
    			1,
    			0
    		],
    		[
    			5,
    			-4
    		],
    		[
    			1,
    			3
    		],
    		[
    			3,
    			1
    		],
    		[
    			2,
    			-13
    		],
    		[
    			2,
    			-4
    		],
    		[
    			2,
    			2
    		],
    		[
    			2,
    			-5
    		],
    		[
    			2,
    			-9
    		],
    		[
    			1,
    			-10
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-2,
    			-19
    		],
    		[
    			-4,
    			-11
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-7,
    			-1
    		],
    		[
    			-1,
    			-21
    		],
    		[
    			-3,
    			-1
    		],
    		[
    			0,
    			-9
    		],
    		[
    			2,
    			-12
    		],
    		[
    			-3,
    			-6
    		],
    		[
    			-2,
    			3
    		],
    		[
    			0,
    			-7
    		],
    		[
    			2,
    			-8
    		],
    		[
    			-1,
    			-13
    		],
    		[
    			-3,
    			-5
    		],
    		[
    			-3,
    			-17
    		],
    		[
    			-3,
    			11
    		],
    		[
    			0,
    			-2
    		],
    		[
    			0,
    			-9
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			-3,
    			4
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			-4,
    			-11
    		],
    		[
    			2,
    			-9
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-4,
    			-8
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			2,
    			-5
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-5,
    			14
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			0,
    			-11
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-1,
    			-15
    		],
    		[
    			-6,
    			-1
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			1,
    			-11
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-2,
    			0
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-4,
    			-4
    		],
    		[
    			-4,
    			-15
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			2,
    			-2
    		],
    		[
    			4,
    			11
    		],
    		[
    			1,
    			-8
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			0,
    			-5
    		],
    		[
    			2,
    			-6
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-3,
    			-7
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-3,
    			-1
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			0,
    			-11
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-1,
    			10
    		],
    		[
    			-1,
    			0
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-2,
    			-13
    		],
    		[
    			-2,
    			0
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-3,
    			12
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			1,
    			-6
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-2,
    			-11
    		],
    		[
    			1,
    			-5
    		],
    		[
    			2,
    			-1
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-3,
    			0
    		],
    		[
    			-3,
    			-2
    		],
    		[
    			-2,
    			12
    		],
    		[
    			0,
    			1
    		],
    		[
    			-5,
    			-5
    		],
    		[
    			-3,
    			-11
    		],
    		[
    			0,
    			-4
    		],
    		[
    			4,
    			3
    		],
    		[
    			2,
    			-6
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-3,
    			6
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-2,
    			2
    		],
    		[
    			0,
    			-11
    		],
    		[
    			-4,
    			1
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-3,
    			-14
    		],
    		[
    			0,
    			-7
    		],
    		[
    			5,
    			-4
    		],
    		[
    			3,
    			-5
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-3,
    			-7
    		],
    		[
    			2,
    			-4
    		],
    		[
    			2,
    			5
    		],
    		[
    			2,
    			-1
    		],
    		[
    			-6,
    			-13
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-2,
    			-13
    		],
    		[
    			1,
    			-10
    		],
    		[
    			-3,
    			2
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-3,
    			13
    		],
    		[
    			1,
    			11
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			0,
    			-12
    		],
    		[
    			0,
    			-3
    		],
    		[
    			0,
    			-11
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-1,
    			10
    		],
    		[
    			-3,
    			-1
    		],
    		[
    			-1,
    			-13
    		],
    		[
    			-3,
    			-1
    		],
    		[
    			-7,
    			-7
    		],
    		[
    			-3,
    			-4
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			0,
    			-12
    		],
    		[
    			-2,
    			8
    		],
    		[
    			1,
    			12
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			1,
    			-5
    		],
    		[
    			1,
    			-16
    		],
    		[
    			-2,
    			-12
    		],
    		[
    			1,
    			-7
    		],
    		[
    			-3,
    			-13
    		],
    		[
    			-3,
    			-5
    		],
    		[
    			0,
    			8
    		],
    		[
    			2,
    			1
    		],
    		[
    			-1,
    			7
    		],
    		[
    			1,
    			18
    		],
    		[
    			1,
    			10
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-4,
    			5
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			1,
    			-7
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-4,
    			-11
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-4,
    			5
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			1,
    			-7
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			0,
    			-13
    		],
    		[
    			-3,
    			-6
    		],
    		[
    			-1,
    			17
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			3,
    			-2
    		],
    		[
    			0,
    			-11
    		],
    		[
    			-3,
    			-1
    		],
    		[
    			-2,
    			4
    		],
    		[
    			1,
    			6
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-2,
    			-14
    		],
    		[
    			-6,
    			-14
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-4,
    			-4
    		],
    		[
    			1,
    			11
    		],
    		[
    			0,
    			14
    		],
    		[
    			3,
    			14
    		],
    		[
    			1,
    			7
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-2,
    			-16
    		],
    		[
    			0,
    			-18
    		],
    		[
    			0,
    			-3
    		],
    		[
    			-5,
    			-30
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			2,
    			-11
    		],
    		[
    			1,
    			-3
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-3,
    			-6
    		],
    		[
    			-2,
    			6
    		],
    		[
    			0,
    			7
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-2,
    			-10
    		],
    		[
    			1,
    			-7
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-3,
    			-1
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-2,
    			12
    		],
    		[
    			2,
    			2
    		],
    		[
    			-2,
    			23
    		],
    		[
    			-2,
    			9
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-1,
    			-13
    		],
    		[
    			2,
    			-5
    		],
    		[
    			2,
    			-11
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			2,
    			-16
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-1,
    			10
    		],
    		[
    			0,
    			5
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-3,
    			-4
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			4,
    			-13
    		],
    		[
    			1,
    			-5
    		],
    		[
    			-5,
    			-18
    		],
    		[
    			-3,
    			-4
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			2,
    			-9
    		],
    		[
    			2,
    			0
    		],
    		[
    			2,
    			4
    		],
    		[
    			1,
    			-2
    		],
    		[
    			2,
    			-14
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-2,
    			1
    		],
    		[
    			0,
    			5
    		],
    		[
    			-4,
    			0
    		],
    		[
    			-2,
    			11
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			0,
    			-12
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			-5,
    			4
    		],
    		[
    			-6,
    			-1
    		],
    		[
    			-3,
    			-2
    		],
    		[
    			-4,
    			-6
    		],
    		[
    			-3,
    			-11
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			-3,
    			-8
    		],
    		[
    			-4,
    			-3
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-3,
    			1
    		],
    		[
    			-3,
    			4
    		],
    		[
    			0,
    			5
    		],
    		[
    			-1,
    			12
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			8
    		],
    		[
    			0,
    			5
    		],
    		[
    			5,
    			7
    		],
    		[
    			1,
    			4
    		],
    		[
    			2,
    			18
    		],
    		[
    			2,
    			17
    		],
    		[
    			1,
    			8
    		],
    		[
    			1,
    			6
    		],
    		[
    			2,
    			2
    		],
    		[
    			2,
    			-7
    		],
    		[
    			4,
    			6
    		],
    		[
    			1,
    			5
    		],
    		[
    			4,
    			3
    		],
    		[
    			4,
    			13
    		],
    		[
    			3,
    			3
    		],
    		[
    			4,
    			-2
    		],
    		[
    			3,
    			1
    		],
    		[
    			0,
    			-7
    		],
    		[
    			3,
    			-8
    		],
    		[
    			1,
    			-13
    		],
    		[
    			0,
    			-9
    		],
    		[
    			2,
    			5
    		],
    		[
    			-1,
    			13
    		],
    		[
    			2,
    			-1
    		],
    		[
    			1,
    			3
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-1,
    			22
    		],
    		[
    			3,
    			7
    		],
    		[
    			3,
    			4
    		],
    		[
    			1,
    			-2
    		],
    		[
    			3,
    			-1
    		],
    		[
    			2,
    			3
    		],
    		[
    			1,
    			7
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			5
    		],
    		[
    			5,
    			8
    		],
    		[
    			2,
    			9
    		],
    		[
    			2,
    			15
    		],
    		[
    			2,
    			9
    		],
    		[
    			5,
    			22
    		],
    		[
    			2,
    			13
    		],
    		[
    			3,
    			7
    		],
    		[
    			1,
    			8
    		],
    		[
    			6,
    			13
    		],
    		[
    			2,
    			11
    		],
    		[
    			3,
    			3
    		],
    		[
    			3,
    			6
    		],
    		[
    			4,
    			3
    		],
    		[
    			4,
    			5
    		],
    		[
    			1,
    			-4
    		],
    		[
    			2,
    			-2
    		],
    		[
    			3,
    			1
    		],
    		[
    			0,
    			-2
    		],
    		[
    			5,
    			10
    		],
    		[
    			1,
    			0
    		],
    		[
    			2,
    			-8
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			0,
    			-7
    		],
    		[
    			4,
    			-14
    		],
    		[
    			1,
    			3
    		],
    		[
    			3,
    			-6
    		],
    		[
    			0,
    			3
    		],
    		[
    			-3,
    			8
    		],
    		[
    			0,
    			14
    		],
    		[
    			1,
    			2
    		],
    		[
    			3,
    			-2
    		],
    		[
    			3,
    			2
    		],
    		[
    			1,
    			-1
    		],
    		[
    			0,
    			-8
    		],
    		[
    			1,
    			-6
    		],
    		[
    			2,
    			1
    		],
    		[
    			2,
    			-5
    		],
    		[
    			1,
    			3
    		],
    		[
    			-1,
    			7
    		],
    		[
    			1,
    			7
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-2,
    			7
    		],
    		[
    			-4,
    			6
    		],
    		[
    			1,
    			8
    		],
    		[
    			-1,
    			4
    		],
    		[
    			2,
    			14
    		],
    		[
    			1,
    			9
    		],
    		[
    			1,
    			20
    		],
    		[
    			1,
    			9
    		],
    		[
    			4,
    			12
    		],
    		[
    			2,
    			10
    		],
    		[
    			2,
    			2
    		],
    		[
    			4,
    			12
    		],
    		[
    			3,
    			13
    		],
    		[
    			8,
    			16
    		],
    		[
    			3,
    			3
    		],
    		[
    			3,
    			5
    		],
    		[
    			2,
    			6
    		],
    		[
    			0,
    			4
    		],
    		[
    			7,
    			17
    		],
    		[
    			1,
    			7
    		],
    		[
    			1,
    			-5
    		],
    		[
    			2,
    			-6
    		],
    		[
    			2,
    			-2
    		],
    		[
    			4,
    			1
    		],
    		[
    			0,
    			5
    		],
    		[
    			-1,
    			21
    		],
    		[
    			1,
    			20
    		],
    		[
    			0,
    			5
    		],
    		[
    			5,
    			28
    		],
    		[
    			3,
    			10
    		],
    		[
    			4,
    			11
    		],
    		[
    			2,
    			4
    		],
    		[
    			4,
    			11
    		],
    		[
    			2,
    			14
    		],
    		[
    			4,
    			12
    		],
    		[
    			2,
    			4
    		],
    		[
    			2,
    			-12
    		],
    		[
    			2,
    			-2
    		],
    		[
    			0,
    			5
    		],
    		[
    			-1,
    			18
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			16
    		],
    		[
    			1,
    			9
    		],
    		[
    			1,
    			18
    		],
    		[
    			1,
    			31
    		],
    		[
    			1,
    			17
    		],
    		[
    			1,
    			7
    		],
    		[
    			4,
    			2
    		],
    		[
    			1,
    			9
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-3,
    			11
    		],
    		[
    			-1,
    			10
    		],
    		[
    			1,
    			11
    		],
    		[
    			2,
    			17
    		],
    		[
    			0,
    			4
    		],
    		[
    			3,
    			6
    		],
    		[
    			2,
    			12
    		],
    		[
    			3,
    			11
    		],
    		[
    			3,
    			9
    		],
    		[
    			2,
    			21
    		],
    		[
    			0,
    			11
    		],
    		[
    			1,
    			5
    		],
    		[
    			0,
    			7
    		],
    		[
    			-2,
    			3
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			-3,
    			-5
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-4,
    			-8
    		],
    		[
    			-3,
    			-4
    		],
    		[
    			0,
    			-3
    		],
    		[
    			-4,
    			-5
    		],
    		[
    			-5,
    			-9
    		],
    		[
    			-5,
    			-8
    		],
    		[
    			-3,
    			-4
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-3,
    			8
    		],
    		[
    			-1,
    			12
    		],
    		[
    			-2,
    			8
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-2,
    			4
    		],
    		[
    			1,
    			7
    		],
    		[
    			1,
    			3
    		],
    		[
    			1,
    			27
    		],
    		[
    			3,
    			7
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-3,
    			-8
    		],
    		[
    			-3,
    			-21
    		],
    		[
    			-3,
    			-7
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			1,
    			-7
    		],
    		[
    			-3,
    			-13
    		],
    		[
    			1,
    			-13
    		],
    		[
    			2,
    			-14
    		],
    		[
    			2,
    			-13
    		],
    		[
    			-3,
    			-14
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			-4,
    			6
    		],
    		[
    			-5,
    			37
    		],
    		[
    			-5,
    			27
    		],
    		[
    			-3,
    			11
    		],
    		[
    			-4,
    			4
    		],
    		[
    			2,
    			10
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-3,
    			0
    		],
    		[
    			-1,
    			-14
    		],
    		[
    			-1,
    			1
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-3,
    			-5
    		],
    		[
    			-2,
    			13
    		],
    		[
    			0,
    			4
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-2,
    			1
    		],
    		[
    			0,
    			9
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-2,
    			8
    		],
    		[
    			-1,
    			1
    		],
    		[
    			2,
    			8
    		],
    		[
    			-1,
    			14
    		],
    		[
    			-5,
    			-8
    		],
    		[
    			-4,
    			-12
    		],
    		[
    			-4,
    			-10
    		],
    		[
    			-2,
    			-15
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-3,
    			-5
    		],
    		[
    			-10,
    			-20
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-4,
    			-7
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-3,
    			7
    		],
    		[
    			-5,
    			-3
    		],
    		[
    			-3,
    			5
    		],
    		[
    			5,
    			8
    		],
    		[
    			1,
    			-6
    		],
    		[
    			2,
    			2
    		],
    		[
    			1,
    			7
    		],
    		[
    			2,
    			13
    		],
    		[
    			0,
    			10
    		],
    		[
    			0,
    			26
    		],
    		[
    			-2,
    			18
    		],
    		[
    			-4,
    			16
    		],
    		[
    			-2,
    			20
    		],
    		[
    			1,
    			7
    		],
    		[
    			2,
    			-6
    		],
    		[
    			0,
    			19
    		],
    		[
    			3,
    			12
    		],
    		[
    			2,
    			8
    		],
    		[
    			1,
    			-1
    		],
    		[
    			1,
    			5
    		],
    		[
    			-2,
    			12
    		],
    		[
    			-2,
    			17
    		],
    		[
    			-2,
    			18
    		],
    		[
    			-3,
    			16
    		],
    		[
    			-2,
    			10
    		],
    		[
    			0,
    			12
    		],
    		[
    			-2,
    			7
    		],
    		[
    			-2,
    			14
    		],
    		[
    			-2,
    			9
    		],
    		[
    			-2,
    			14
    		],
    		[
    			1,
    			10
    		],
    		[
    			-3,
    			8
    		],
    		[
    			0,
    			10
    		],
    		[
    			1,
    			0
    		],
    		[
    			3,
    			8
    		],
    		[
    			0,
    			16
    		],
    		[
    			2,
    			11
    		],
    		[
    			0,
    			11
    		],
    		[
    			2,
    			9
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-4,
    			-37
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-1,
    			-16
    		],
    		[
    			3,
    			-5
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			0,
    			-12
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-4,
    			-5
    		],
    		[
    			-3,
    			1
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-6,
    			-9
    		],
    		[
    			-6,
    			-12
    		],
    		[
    			-5,
    			-5
    		],
    		[
    			-6,
    			-3
    		],
    		[
    			-6,
    			-1
    		],
    		[
    			-4,
    			1
    		],
    		[
    			-5,
    			7
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-2,
    			16
    		],
    		[
    			2,
    			3
    		],
    		[
    			0,
    			5
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-6,
    			10
    		],
    		[
    			-3,
    			17
    		],
    		[
    			0,
    			6
    		],
    		[
    			-4,
    			8
    		],
    		[
    			-1,
    			10
    		],
    		[
    			-5,
    			1
    		],
    		[
    			-3,
    			7
    		],
    		[
    			-2,
    			8
    		],
    		[
    			-2,
    			9
    		],
    		[
    			2,
    			6
    		],
    		[
    			2,
    			8
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-4,
    			-9
    		],
    		[
    			-5,
    			2
    		],
    		[
    			-2,
    			8
    		],
    		[
    			2,
    			5
    		],
    		[
    			3,
    			1
    		],
    		[
    			3,
    			13
    		],
    		[
    			2,
    			7
    		],
    		[
    			3,
    			4
    		],
    		[
    			-2,
    			9
    		],
    		[
    			0,
    			15
    		],
    		[
    			3,
    			16
    		],
    		[
    			-2,
    			0
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-3,
    			0
    		],
    		[
    			-1,
    			7
    		],
    		[
    			2,
    			4
    		],
    		[
    			-1,
    			10
    		],
    		[
    			2,
    			8
    		],
    		[
    			3,
    			-1
    		],
    		[
    			1,
    			3
    		],
    		[
    			1,
    			11
    		],
    		[
    			-2,
    			4
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-3,
    			4
    		],
    		[
    			-2,
    			7
    		],
    		[
    			0,
    			6
    		],
    		[
    			-3,
    			6
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			1,
    			-6
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-4,
    			4
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-1,
    			21
    		],
    		[
    			0,
    			10
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-4,
    			3
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-1,
    			16
    		],
    		[
    			4,
    			7
    		],
    		[
    			0,
    			8
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-3,
    			5
    		],
    		[
    			-5,
    			-4
    		],
    		[
    			1,
    			-6
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-1,
    			10
    		],
    		[
    			-1,
    			7
    		],
    		[
    			1,
    			9
    		],
    		[
    			3,
    			1
    		],
    		[
    			7,
    			6
    		],
    		[
    			-6,
    			11
    		],
    		[
    			-2,
    			13
    		],
    		[
    			0,
    			3
    		],
    		[
    			4,
    			3
    		],
    		[
    			5,
    			-1
    		],
    		[
    			1,
    			3
    		],
    		[
    			2,
    			1
    		],
    		[
    			1,
    			5
    		],
    		[
    			-2,
    			9
    		],
    		[
    			-2,
    			16
    		],
    		[
    			1,
    			13
    		],
    		[
    			1,
    			12
    		],
    		[
    			10,
    			44
    		],
    		[
    			2,
    			10
    		],
    		[
    			4,
    			17
    		],
    		[
    			1,
    			11
    		],
    		[
    			2,
    			11
    		],
    		[
    			2,
    			6
    		],
    		[
    			3,
    			3
    		],
    		[
    			-1,
    			18
    		],
    		[
    			2,
    			31
    		],
    		[
    			2,
    			11
    		],
    		[
    			4,
    			10
    		],
    		[
    			-2,
    			7
    		],
    		[
    			6,
    			21
    		],
    		[
    			2,
    			3
    		],
    		[
    			6,
    			6
    		],
    		[
    			3,
    			1
    		],
    		[
    			4,
    			-8
    		],
    		[
    			4,
    			-1
    		],
    		[
    			4,
    			-14
    		],
    		[
    			2,
    			-1
    		],
    		[
    			1,
    			-4
    		],
    		[
    			5,
    			-14
    		],
    		[
    			5,
    			2
    		],
    		[
    			3,
    			2
    		],
    		[
    			1,
    			5
    		],
    		[
    			4,
    			13
    		],
    		[
    			1,
    			9
    		],
    		[
    			4,
    			5
    		],
    		[
    			2,
    			8
    		]
    	],
    	[
    		[
    			275,
    			8500
    		],
    		[
    			5,
    			-1
    		],
    		[
    			3,
    			1
    		],
    		[
    			8,
    			-9
    		],
    		[
    			-2,
    			-21
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-5,
    			6
    		],
    		[
    			-5,
    			0
    		],
    		[
    			-5,
    			-5
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-3,
    			-7
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			0,
    			-12
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-3,
    			3
    		],
    		[
    			0,
    			4
    		],
    		[
    			-2,
    			19
    		],
    		[
    			-4,
    			10
    		],
    		[
    			-5,
    			10
    		],
    		[
    			-3,
    			-1
    		],
    		[
    			-2,
    			11
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-6,
    			13
    		],
    		[
    			-8,
    			11
    		],
    		[
    			-3,
    			2
    		],
    		[
    			-4,
    			0
    		],
    		[
    			-5,
    			-7
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			-4,
    			-5
    		],
    		[
    			-3,
    			5
    		],
    		[
    			-5,
    			6
    		],
    		[
    			-2,
    			14
    		],
    		[
    			-1,
    			8
    		],
    		[
    			1,
    			18
    		],
    		[
    			2,
    			16
    		],
    		[
    			0,
    			10
    		],
    		[
    			1,
    			2
    		],
    		[
    			-1,
    			10
    		],
    		[
    			2,
    			1
    		],
    		[
    			1,
    			-7
    		],
    		[
    			0,
    			-8
    		],
    		[
    			1,
    			-5
    		],
    		[
    			6,
    			-9
    		],
    		[
    			10,
    			-10
    		],
    		[
    			4,
    			-1
    		],
    		[
    			5,
    			14
    		],
    		[
    			6,
    			9
    		],
    		[
    			6,
    			-2
    		],
    		[
    			3,
    			-11
    		],
    		[
    			2,
    			-3
    		],
    		[
    			2,
    			-16
    		],
    		[
    			0,
    			-7
    		],
    		[
    			5,
    			-9
    		],
    		[
    			6,
    			-2
    		],
    		[
    			2,
    			-11
    		],
    		[
    			8,
    			-5
    		]
    	],
    	[
    		[
    			461,
    			8552
    		],
    		[
    			2,
    			3
    		],
    		[
    			2,
    			-3
    		],
    		[
    			2,
    			1
    		],
    		[
    			1,
    			-6
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-7,
    			-2
    		],
    		[
    			-2,
    			3
    		],
    		[
    			0,
    			5
    		],
    		[
    			2,
    			7
    		]
    	],
    	[
    		[
    			1953,
    			3569
    		],
    		[
    			0,
    			-93
    		],
    		[
    			0,
    			-60
    		],
    		[
    			0,
    			-106
    		],
    		[
    			0,
    			-82
    		],
    		[
    			0,
    			-76
    		],
    		[
    			0,
    			-46
    		],
    		[
    			0,
    			-98
    		],
    		[
    			0,
    			-70
    		],
    		[
    			0,
    			-104
    		],
    		[
    			0,
    			-55
    		],
    		[
    			0,
    			-66
    		],
    		[
    			0,
    			-63
    		],
    		[
    			0,
    			-84
    		],
    		[
    			0,
    			-57
    		]
    	],
    	[
    		[
    			1953,
    			2509
    		],
    		[
    			-7,
    			0
    		],
    		[
    			-15,
    			0
    		],
    		[
    			-17,
    			0
    		],
    		[
    			-18,
    			0
    		],
    		[
    			-13,
    			29
    		],
    		[
    			-12,
    			25
    		],
    		[
    			-12,
    			24
    		],
    		[
    			-13,
    			27
    		],
    		[
    			-7,
    			14
    		],
    		[
    			-18,
    			39
    		],
    		[
    			-13,
    			27
    		],
    		[
    			-16,
    			32
    		],
    		[
    			0,
    			3
    		],
    		[
    			0,
    			20
    		],
    		[
    			2,
    			5
    		],
    		[
    			1,
    			14
    		]
    	],
    	[
    		[
    			1795,
    			2768
    		],
    		[
    			1,
    			4
    		],
    		[
    			2,
    			-2
    		],
    		[
    			2,
    			5
    		],
    		[
    			0,
    			7
    		],
    		[
    			2,
    			10
    		],
    		[
    			0,
    			12
    		],
    		[
    			-1,
    			20
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			11
    		],
    		[
    			1,
    			12
    		],
    		[
    			0,
    			20
    		],
    		[
    			-1,
    			6
    		],
    		[
    			0,
    			7
    		],
    		[
    			0,
    			11
    		],
    		[
    			1,
    			4
    		],
    		[
    			1,
    			2
    		],
    		[
    			1,
    			5
    		],
    		[
    			1,
    			14
    		],
    		[
    			1,
    			4
    		],
    		[
    			0,
    			7
    		],
    		[
    			0,
    			6
    		],
    		[
    			0,
    			10
    		],
    		[
    			1,
    			4
    		],
    		[
    			0,
    			7
    		],
    		[
    			0,
    			6
    		],
    		[
    			-1,
    			15
    		],
    		[
    			1,
    			4
    		],
    		[
    			0,
    			8
    		],
    		[
    			-1,
    			3
    		],
    		[
    			2,
    			13
    		],
    		[
    			1,
    			8
    		],
    		[
    			0,
    			9
    		],
    		[
    			0,
    			4
    		],
    		[
    			3,
    			5
    		],
    		[
    			1,
    			7
    		],
    		[
    			1,
    			0
    		],
    		[
    			2,
    			15
    		],
    		[
    			1,
    			2
    		],
    		[
    			0,
    			8
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-2,
    			12
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-1,
    			2
    		],
    		[
    			0,
    			13
    		],
    		[
    			-1,
    			12
    		],
    		[
    			0,
    			3
    		],
    		[
    			-1,
    			19
    		],
    		[
    			-2,
    			10
    		],
    		[
    			-1,
    			13
    		],
    		[
    			-2,
    			6
    		],
    		[
    			0,
    			25
    		]
    	],
    	[
    		[
    			1797,
    			3195
    		],
    		[
    			0,
    			5
    		],
    		[
    			1,
    			9
    		],
    		[
    			-1,
    			4
    		],
    		[
    			1,
    			5
    		],
    		[
    			1,
    			3
    		],
    		[
    			0,
    			8
    		],
    		[
    			-1,
    			22
    		],
    		[
    			0,
    			5
    		],
    		[
    			-1,
    			16
    		],
    		[
    			0,
    			3
    		],
    		[
    			-1,
    			12
    		],
    		[
    			1,
    			8
    		],
    		[
    			-1,
    			8
    		],
    		[
    			1,
    			6
    		],
    		[
    			-1,
    			8
    		],
    		[
    			0,
    			7
    		],
    		[
    			-1,
    			4
    		],
    		[
    			1,
    			9
    		],
    		[
    			-1,
    			9
    		],
    		[
    			1,
    			15
    		],
    		[
    			-1,
    			11
    		],
    		[
    			-1,
    			7
    		],
    		[
    			1,
    			8
    		],
    		[
    			-1,
    			12
    		],
    		[
    			0,
    			3
    		],
    		[
    			4,
    			5
    		],
    		[
    			1,
    			4
    		],
    		[
    			2,
    			-1
    		],
    		[
    			0,
    			-3
    		],
    		[
    			2,
    			2
    		],
    		[
    			2,
    			0
    		],
    		[
    			1,
    			-7
    		],
    		[
    			1,
    			-11
    		],
    		[
    			1,
    			-6
    		],
    		[
    			3,
    			2
    		],
    		[
    			2,
    			29
    		],
    		[
    			1,
    			3
    		],
    		[
    			0,
    			36
    		],
    		[
    			-1,
    			50
    		],
    		[
    			0,
    			64
    		]
    	],
    	[
    		[
    			1813,
    			3569
    		],
    		[
    			3,
    			0
    		],
    		[
    			28,
    			0
    		],
    		[
    			17,
    			1
    		],
    		[
    			26,
    			0
    		],
    		[
    			10,
    			0
    		],
    		[
    			15,
    			0
    		],
    		[
    			1,
    			-1
    		],
    		[
    			13,
    			0
    		],
    		[
    			11,
    			0
    		],
    		[
    			16,
    			0
    		]
    	],
    	[
    		[
    			2371,
    			2824
    		],
    		[
    			0,
    			100
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			0,
    			4
    		],
    		[
    			-4,
    			-2
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-1,
    			8
    		],
    		[
    			0,
    			8
    		],
    		[
    			-1,
    			1
    		]
    	],
    	[
    		[
    			2359,
    			2940
    		],
    		[
    			0,
    			103
    		],
    		[
    			0,
    			85
    		],
    		[
    			1,
    			55
    		],
    		[
    			0,
    			86
    		],
    		[
    			-2,
    			101
    		],
    		[
    			-2,
    			68
    		],
    		[
    			-1,
    			38
    		]
    	],
    	[
    		[
    			2355,
    			3476
    		],
    		[
    			14,
    			0
    		],
    		[
    			11,
    			0
    		],
    		[
    			16,
    			-1
    		],
    		[
    			10,
    			0
    		],
    		[
    			12,
    			0
    		],
    		[
    			10,
    			0
    		],
    		[
    			13,
    			1
    		],
    		[
    			3,
    			-1
    		],
    		[
    			20,
    			1
    		],
    		[
    			15,
    			-1
    		],
    		[
    			1,
    			-15
    		],
    		[
    			1,
    			-3
    		],
    		[
    			1,
    			-3
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			1,
    			-3
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-3,
    			-8
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-2,
    			-23
    		],
    		[
    			18,
    			1
    		]
    	],
    	[
    		[
    			2491,
    			3382
    		],
    		[
    			0,
    			-7
    		],
    		[
    			2,
    			-7
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			0,
    			-6
    		],
    		[
    			2,
    			-4
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			0,
    			-9
    		],
    		[
    			0,
    			-5
    		],
    		[
    			2,
    			-2
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			0,
    			-7
    		],
    		[
    			1,
    			-1
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			0,
    			-9
    		],
    		[
    			1,
    			-7
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-2,
    			1
    		],
    		[
    			1,
    			6
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			1,
    			-6
    		],
    		[
    			0,
    			4
    		],
    		[
    			1,
    			-5
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			0,
    			-6
    		],
    		[
    			2,
    			-2
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			2,
    			-10
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-1,
    			-17
    		],
    		[
    			-3,
    			3
    		],
    		[
    			0,
    			-9
    		]
    	],
    	[
    		[
    			2475,
    			3194
    		],
    		[
    			2,
    			-8
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-3,
    			-9
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-1,
    			9
    		],
    		[
    			0,
    			2
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			1,
    			-7
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			1,
    			-8
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-2,
    			6
    		],
    		[
    			0,
    			-4
    		],
    		[
    			0,
    			-6
    		]
    	],
    	[
    		[
    			2468,
    			3139
    		],
    		[
    			2,
    			-1
    		],
    		[
    			1,
    			-4
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			-1,
    			0
    		],
    		[
    			0,
    			13
    		]
    	],
    	[
    		[
    			2468,
    			3139
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			0,
    			-10
    		],
    		[
    			1,
    			-10
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			0,
    			-5
    		],
    		[
    			1,
    			-11
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			0,
    			9
    		],
    		[
    			-2,
    			0
    		],
    		[
    			0,
    			-5
    		],
    		[
    			1,
    			-7
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			0,
    			-11
    		],
    		[
    			-2,
    			7
    		],
    		[
    			0,
    			-6
    		],
    		[
    			1,
    			-6
    		],
    		[
    			2,
    			0
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			0,
    			-6
    		],
    		[
    			2,
    			-5
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-3,
    			-2
    		],
    		[
    			1,
    			-7
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			0,
    			-4
    		],
    		[
    			2,
    			-5
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			0,
    			-10
    		],
    		[
    			2,
    			-3
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			2
    		],
    		[
    			0,
    			-10
    		],
    		[
    			0,
    			-4
    		],
    		[
    			2,
    			2
    		],
    		[
    			1,
    			-8
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			0,
    			-5
    		],
    		[
    			2,
    			-7
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-3,
    			-7
    		],
    		[
    			0,
    			-2
    		],
    		[
    			2,
    			-10
    		]
    	],
    	[
    		[
    			2451,
    			2914
    		],
    		[
    			-2,
    			-11
    		],
    		[
    			1,
    			-1
    		],
    		[
    			1,
    			3
    		],
    		[
    			0,
    			9
    		]
    	],
    	[
    		[
    			2451,
    			2914
    		],
    		[
    			1,
    			-5
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			1,
    			-4
    		],
    		[
    			1,
    			2
    		],
    		[
    			1,
    			11
    		],
    		[
    			1,
    			-4
    		],
    		[
    			-2,
    			-15
    		],
    		[
    			0,
    			-9
    		],
    		[
    			1,
    			-10
    		],
    		[
    			1,
    			7
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			0,
    			-14
    		],
    		[
    			0,
    			-3
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			2,
    			-8
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-1,
    			-7
    		]
    	],
    	[
    		[
    			2451,
    			2821
    		],
    		[
    			-9,
    			1
    		],
    		[
    			-13,
    			0
    		],
    		[
    			-7,
    			0
    		],
    		[
    			-16,
    			1
    		],
    		[
    			-8,
    			1
    		],
    		[
    			-12,
    			0
    		],
    		[
    			-15,
    			0
    		]
    	],
    	[
    		[
    			1641,
    			3008
    		],
    		[
    			2,
    			1
    		],
    		[
    			1,
    			4
    		],
    		[
    			2,
    			-1
    		],
    		[
    			2,
    			-8
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-1,
    			13
    		],
    		[
    			-1,
    			2
    		]
    	],
    	[
    		[
    			1654,
    			3019
    		],
    		[
    			1,
    			-1
    		],
    		[
    			1,
    			-6
    		],
    		[
    			2,
    			-1
    		],
    		[
    			1,
    			6
    		],
    		[
    			2,
    			-1
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-4,
    			2
    		],
    		[
    			-1,
    			2
    		],
    		[
    			0,
    			10
    		],
    		[
    			-1,
    			8
    		],
    		[
    			4,
    			-3
    		]
    	],
    	[
    		[
    			1635,
    			3016
    		],
    		[
    			2,
    			2
    		],
    		[
    			1,
    			4
    		],
    		[
    			1,
    			-10
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-3,
    			5
    		]
    	],
    	[
    		[
    			1689,
    			2801
    		],
    		[
    			-2,
    			14
    		],
    		[
    			1,
    			2
    		],
    		[
    			2,
    			-9
    		],
    		[
    			3,
    			-17
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-2,
    			10
    		],
    		[
    			-1,
    			8
    		]
    	],
    	[
    		[
    			1690,
    			2905
    		],
    		[
    			3,
    			-8
    		],
    		[
    			0,
    			-4
    		],
    		[
    			2,
    			-9
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			12
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-1,
    			5
    		],
    		[
    			1,
    			1
    		],
    		[
    			2,
    			-4
    		]
    	],
    	[
    		[
    			1660,
    			2873
    		],
    		[
    			1,
    			1
    		],
    		[
    			2,
    			-6
    		],
    		[
    			1,
    			-5
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-2,
    			3
    		],
    		[
    			0,
    			3
    		],
    		[
    			0,
    			6
    		]
    	],
    	[
    		[
    			1648,
    			4504
    		],
    		[
    			0,
    			-70
    		],
    		[
    			0,
    			-82
    		],
    		[
    			0,
    			-58
    		],
    		[
    			0,
    			-70
    		],
    		[
    			0,
    			-101
    		],
    		[
    			0,
    			-78
    		],
    		[
    			0,
    			-59
    		],
    		[
    			0,
    			-42
    		],
    		[
    			11,
    			-54
    		],
    		[
    			14,
    			-64
    		],
    		[
    			9,
    			-43
    		],
    		[
    			14,
    			-70
    		],
    		[
    			11,
    			-51
    		],
    		[
    			4,
    			-22
    		],
    		[
    			10,
    			-47
    		],
    		[
    			10,
    			-52
    		],
    		[
    			13,
    			-65
    		],
    		[
    			13,
    			-65
    		],
    		[
    			9,
    			-50
    		],
    		[
    			13,
    			-70
    		],
    		[
    			10,
    			-49
    		],
    		[
    			8,
    			-47
    		]
    	],
    	[
    		[
    			1795,
    			2768
    		],
    		[
    			-8,
    			-4
    		],
    		[
    			-13,
    			-6
    		],
    		[
    			-16,
    			-8
    		],
    		[
    			-16,
    			-9
    		],
    		[
    			-14,
    			-7
    		],
    		[
    			-1,
    			17
    		],
    		[
    			0,
    			6
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			0,
    			10
    		],
    		[
    			0,
    			15
    		],
    		[
    			-1,
    			7
    		],
    		[
    			1,
    			6
    		],
    		[
    			0,
    			26
    		],
    		[
    			-2,
    			21
    		],
    		[
    			-3,
    			27
    		],
    		[
    			-2,
    			12
    		],
    		[
    			-2,
    			10
    		],
    		[
    			-2,
    			10
    		],
    		[
    			-2,
    			8
    		],
    		[
    			-2,
    			11
    		],
    		[
    			-2,
    			10
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-3,
    			9
    		],
    		[
    			-2,
    			14
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-2,
    			2
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-1,
    			1
    		],
    		[
    			0,
    			6
    		],
    		[
    			0,
    			5
    		],
    		[
    			1,
    			7
    		],
    		[
    			-2,
    			19
    		],
    		[
    			-1,
    			10
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-5,
    			-2
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-3,
    			3
    		],
    		[
    			-4,
    			9
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-2,
    			7
    		],
    		[
    			0,
    			1
    		],
    		[
    			-2,
    			13
    		],
    		[
    			0,
    			7
    		],
    		[
    			-3,
    			13
    		],
    		[
    			0,
    			-1
    		],
    		[
    			-2,
    			11
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-3,
    			4
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-3,
    			0
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-5,
    			-1
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-3,
    			-2
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			9
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-2,
    			0
    		],
    		[
    			0,
    			5
    		],
    		[
    			1,
    			20
    		],
    		[
    			-1,
    			12
    		],
    		[
    			1,
    			17
    		],
    		[
    			-1,
    			11
    		],
    		[
    			-1,
    			0
    		],
    		[
    			1,
    			19
    		],
    		[
    			0,
    			11
    		],
    		[
    			0,
    			11
    		],
    		[
    			0,
    			5
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-1,
    			7
    		],
    		[
    			1,
    			15
    		],
    		[
    			0,
    			15
    		],
    		[
    			-2,
    			8
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-3,
    			17
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-1,
    			8
    		],
    		[
    			0,
    			13
    		],
    		[
    			-2,
    			7
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-1,
    			16
    		],
    		[
    			0,
    			5
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-2,
    			17
    		],
    		[
    			-2,
    			15
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-2,
    			16
    		],
    		[
    			0,
    			12
    		],
    		[
    			-1,
    			19
    		],
    		[
    			0,
    			14
    		],
    		[
    			-1,
    			4
    		],
    		[
    			1,
    			10
    		],
    		[
    			2,
    			-6
    		],
    		[
    			1,
    			10
    		],
    		[
    			1,
    			28
    		],
    		[
    			-2,
    			24
    		],
    		[
    			-2,
    			8
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-4,
    			0
    		],
    		[
    			-3,
    			11
    		],
    		[
    			-2,
    			16
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-1,
    			10
    		],
    		[
    			1,
    			21
    		],
    		[
    			-1,
    			14
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-1,
    			3
    		],
    		[
    			0,
    			5
    		],
    		[
    			0,
    			13
    		],
    		[
    			0,
    			2
    		],
    		[
    			0,
    			16
    		],
    		[
    			0,
    			18
    		],
    		[
    			1,
    			4
    		],
    		[
    			2,
    			1
    		],
    		[
    			0,
    			-4
    		],
    		[
    			1,
    			-13
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			1,
    			-9
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			1,
    			-9
    		],
    		[
    			3,
    			-3
    		],
    		[
    			2,
    			-13
    		],
    		[
    			2,
    			0
    		],
    		[
    			0,
    			4
    		],
    		[
    			-1,
    			11
    		],
    		[
    			-1,
    			15
    		],
    		[
    			-2,
    			10
    		],
    		[
    			0,
    			8
    		],
    		[
    			-2,
    			4
    		],
    		[
    			0,
    			5
    		],
    		[
    			1,
    			4
    		],
    		[
    			-1,
    			11
    		],
    		[
    			0,
    			3
    		],
    		[
    			-2,
    			1
    		],
    		[
    			0,
    			5
    		],
    		[
    			1,
    			7
    		],
    		[
    			0,
    			6
    		],
    		[
    			2,
    			1
    		],
    		[
    			1,
    			6
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-2,
    			7
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			1,
    			-7
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			1,
    			-3
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			1,
    			-12
    		],
    		[
    			0,
    			-13
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-4,
    			16
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-2,
    			10
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			1,
    			21
    		],
    		[
    			1,
    			7
    		],
    		[
    			-1,
    			9
    		],
    		[
    			0,
    			8
    		],
    		[
    			-1,
    			10
    		],
    		[
    			-2,
    			5
    		],
    		[
    			0,
    			7
    		],
    		[
    			-1,
    			17
    		],
    		[
    			-2,
    			8
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-2,
    			10
    		],
    		[
    			-3,
    			26
    		],
    		[
    			-2,
    			7
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-3,
    			13
    		],
    		[
    			0,
    			5
    		],
    		[
    			-2,
    			8
    		],
    		[
    			0,
    			8
    		],
    		[
    			1,
    			9
    		],
    		[
    			0,
    			9
    		],
    		[
    			-1,
    			21
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-1,
    			13
    		],
    		[
    			-1,
    			17
    		],
    		[
    			0,
    			14
    		],
    		[
    			2,
    			20
    		],
    		[
    			-1,
    			10
    		],
    		[
    			0,
    			15
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-1,
    			20
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-3,
    			19
    		],
    		[
    			-1,
    			3
    		],
    		[
    			0,
    			7
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-5,
    			25
    		],
    		[
    			1,
    			10
    		],
    		[
    			-1,
    			14
    		],
    		[
    			-1,
    			9
    		],
    		[
    			1,
    			12
    		],
    		[
    			1,
    			21
    		],
    		[
    			2,
    			22
    		],
    		[
    			3,
    			27
    		],
    		[
    			1,
    			9
    		],
    		[
    			0,
    			19
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			17
    		],
    		[
    			1,
    			16
    		],
    		[
    			1,
    			27
    		],
    		[
    			1,
    			12
    		],
    		[
    			-1,
    			21
    		],
    		[
    			0,
    			10
    		],
    		[
    			-1,
    			10
    		],
    		[
    			-1,
    			10
    		],
    		[
    			-3,
    			14
    		],
    		[
    			1,
    			11
    		],
    		[
    			1,
    			18
    		],
    		[
    			-1,
    			11
    		]
    	],
    	[
    		[
    			1530,
    			4505
    		],
    		[
    			6,
    			-1
    		],
    		[
    			8,
    			1
    		],
    		[
    			8,
    			1
    		],
    		[
    			2,
    			-1
    		],
    		[
    			6,
    			2
    		],
    		[
    			3,
    			-1
    		],
    		[
    			11,
    			0
    		],
    		[
    			8,
    			1
    		],
    		[
    			10,
    			-1
    		],
    		[
    			12,
    			-1
    		],
    		[
    			15,
    			-1
    		],
    		[
    			11,
    			0
    		],
    		[
    			10,
    			0
    		],
    		[
    			8,
    			0
    		]
    	],
    	[
    		[
    			2092,
    			4318
    		],
    		[
    			15,
    			0
    		],
    		[
    			18,
    			0
    		],
    		[
    			9,
    			0
    		],
    		[
    			14,
    			0
    		],
    		[
    			0,
    			-86
    		],
    		[
    			0,
    			-101
    		]
    	],
    	[
    		[
    			2148,
    			4131
    		],
    		[
    			0,
    			-66
    		],
    		[
    			0,
    			-65
    		],
    		[
    			0,
    			-91
    		],
    		[
    			0,
    			-68
    		],
    		[
    			0,
    			-76
    		],
    		[
    			0,
    			-68
    		],
    		[
    			0,
    			-62
    		],
    		[
    			0,
    			-67
    		]
    	],
    	[
    		[
    			2148,
    			3568
    		],
    		[
    			-18,
    			0
    		],
    		[
    			-3,
    			2
    		],
    		[
    			-6,
    			-1
    		]
    	],
    	[
    		[
    			2121,
    			3569
    		],
    		[
    			-20,
    			0
    		],
    		[
    			-17,
    			-1
    		],
    		[
    			-18,
    			0
    		],
    		[
    			-4,
    			1
    		],
    		[
    			-14,
    			0
    		],
    		[
    			-16,
    			-1
    		],
    		[
    			-18,
    			0
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-15,
    			0
    		],
    		[
    			-16,
    			0
    		],
    		[
    			-7,
    			0
    		],
    		[
    			-10,
    			0
    		],
    		[
    			-12,
    			0
    		]
    	],
    	[
    		[
    			1953,
    			3569
    		],
    		[
    			0,
    			71
    		],
    		[
    			0,
    			29
    		],
    		[
    			0,
    			70
    		],
    		[
    			0,
    			48
    		],
    		[
    			0,
    			21
    		],
    		[
    			0,
    			83
    		],
    		[
    			0,
    			29
    		],
    		[
    			0,
    			47
    		],
    		[
    			0,
    			70
    		],
    		[
    			0,
    			70
    		],
    		[
    			0,
    			107
    		],
    		[
    			0,
    			33
    		],
    		[
    			0,
    			71
    		]
    	],
    	[
    		[
    			1953,
    			4318
    		],
    		[
    			4,
    			0
    		],
    		[
    			18,
    			0
    		],
    		[
    			17,
    			0
    		],
    		[
    			22,
    			1
    		],
    		[
    			11,
    			-1
    		],
    		[
    			7,
    			0
    		],
    		[
    			13,
    			-1
    		],
    		[
    			13,
    			1
    		],
    		[
    			12,
    			0
    		],
    		[
    			5,
    			0
    		],
    		[
    			17,
    			0
    		]
    	],
    	[
    		[
    			2991,
    			4507
    		],
    		[
    			0,
    			-66
    		],
    		[
    			0,
    			-45
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			1,
    			-12
    		],
    		[
    			-1,
    			-5
    		]
    	],
    	[
    		[
    			2989,
    			4378
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-4,
    			-4
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-3,
    			0
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-4,
    			-5
    		],
    		[
    			0,
    			8
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-3,
    			-11
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			-6
    		]
    	],
    	[
    		[
    			2939,
    			4315
    		],
    		[
    			0,
    			5
    		],
    		[
    			-2,
    			17
    		],
    		[
    			7,
    			21
    		],
    		[
    			-2,
    			15
    		],
    		[
    			1,
    			61
    		],
    		[
    			1,
    			80
    		]
    	],
    	[
    		[
    			2944,
    			4514
    		],
    		[
    			1,
    			1
    		],
    		[
    			12,
    			-3
    		],
    		[
    			5,
    			0
    		],
    		[
    			0,
    			-7
    		],
    		[
    			2,
    			1
    		],
    		[
    			0,
    			5
    		],
    		[
    			2,
    			1
    		],
    		[
    			3,
    			-1
    		],
    		[
    			1,
    			1
    		],
    		[
    			11,
    			-1
    		],
    		[
    			10,
    			-1
    		],
    		[
    			0,
    			-3
    		]
    	],
    	[
    		[
    			2890,
    			4094
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			-1,
    			-5
    		]
    	],
    	[
    		[
    			2887,
    			4072
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			2,
    			-7
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			0,
    			-7
    		],
    		[
    			1,
    			-8
    		],
    		[
    			1,
    			-10
    		],
    		[
    			2,
    			-10
    		],
    		[
    			1,
    			-11
    		],
    		[
    			0,
    			-9
    		],
    		[
    			0,
    			-9
    		],
    		[
    			0,
    			-18
    		],
    		[
    			2,
    			-7
    		],
    		[
    			1,
    			-7
    		],
    		[
    			0,
    			-11
    		],
    		[
    			3,
    			-22
    		],
    		[
    			2,
    			-5
    		],
    		[
    			1,
    			-2
    		],
    		[
    			1,
    			-21
    		],
    		[
    			0,
    			-39
    		]
    	],
    	[
    		[
    			2900,
    			3841
    		],
    		[
    			-11,
    			0
    		],
    		[
    			-7,
    			2
    		],
    		[
    			-1,
    			76
    		],
    		[
    			-1,
    			71
    		],
    		[
    			-1,
    			77
    		],
    		[
    			0,
    			12
    		]
    	],
    	[
    		[
    			2879,
    			4079
    		],
    		[
    			3,
    			15
    		],
    		[
    			2,
    			6
    		],
    		[
    			3,
    			0
    		],
    		[
    			3,
    			-6
    		]
    	],
    	[
    		[
    			2845,
    			3905
    		],
    		[
    			0,
    			11
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-2,
    			6
    		]
    	],
    	[
    		[
    			2842,
    			3931
    		],
    		[
    			3,
    			12
    		],
    		[
    			3,
    			-19
    		],
    		[
    			-3,
    			-19
    		]
    	],
    	[
    		[
    			2718,
    			1260
    		],
    		[
    			1,
    			6
    		],
    		[
    			0,
    			-3
    		],
    		[
    			1,
    			5
    		],
    		[
    			2,
    			2
    		],
    		[
    			0,
    			4
    		],
    		[
    			1,
    			1
    		],
    		[
    			1,
    			-6
    		],
    		[
    			1,
    			-2
    		],
    		[
    			1,
    			-9
    		],
    		[
    			-3,
    			-6
    		],
    		[
    			0,
    			5
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-4,
    			-11
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			0,
    			8
    		],
    		[
    			3,
    			2
    		],
    		[
    			1,
    			5
    		],
    		[
    			1,
    			5
    		],
    		[
    			1,
    			2
    		]
    	],
    	[
    		[
    			2702,
    			1244
    		],
    		[
    			1,
    			2
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-1,
    			5
    		]
    	],
    	[
    		[
    			2737,
    			1282
    		],
    		[
    			-3,
    			-11
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-1,
    			3
    		],
    		[
    			3,
    			4
    		],
    		[
    			3,
    			9
    		]
    	],
    	[
    		[
    			2618,
    			2199
    		],
    		[
    			2,
    			2
    		],
    		[
    			1,
    			-3
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			8
    		]
    	],
    	[
    		[
    			2699,
    			1642
    		],
    		[
    			1,
    			-14
    		],
    		[
    			1,
    			-23
    		],
    		[
    			1,
    			-5
    		],
    		[
    			2,
    			-4
    		],
    		[
    			1,
    			3
    		],
    		[
    			1,
    			-4
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-2,
    			8
    		],
    		[
    			-1,
    			17
    		],
    		[
    			-1,
    			15
    		],
    		[
    			-1,
    			8
    		],
    		[
    			0,
    			4
    		]
    	],
    	[
    		[
    			2755,
    			1387
    		],
    		[
    			-3,
    			-28
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			0,
    			5
    		],
    		[
    			0,
    			6
    		],
    		[
    			0,
    			4
    		],
    		[
    			1,
    			4
    		],
    		[
    			1,
    			11
    		],
    		[
    			1,
    			8
    		],
    		[
    			1,
    			9
    		],
    		[
    			0,
    			7
    		],
    		[
    			1,
    			0
    		],
    		[
    			-1,
    			-11
    		]
    	],
    	[
    		[
    			2722,
    			2392
    		],
    		[
    			0,
    			-2
    		],
    		[
    			0,
    			-18
    		],
    		[
    			0,
    			-15
    		],
    		[
    			1,
    			-8
    		],
    		[
    			0,
    			-15
    		],
    		[
    			0,
    			-24
    		],
    		[
    			3,
    			-57
    		],
    		[
    			1,
    			-12
    		],
    		[
    			0,
    			-22
    		],
    		[
    			1,
    			-9
    		],
    		[
    			2,
    			-34
    		],
    		[
    			3,
    			-46
    		],
    		[
    			2,
    			-30
    		],
    		[
    			2,
    			-16
    		],
    		[
    			1,
    			-10
    		],
    		[
    			4,
    			-47
    		],
    		[
    			4,
    			-33
    		],
    		[
    			0,
    			-10
    		],
    		[
    			1,
    			-13
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			0,
    			-20
    		],
    		[
    			1,
    			-15
    		],
    		[
    			0,
    			-15
    		],
    		[
    			2,
    			-24
    		],
    		[
    			3,
    			-43
    		],
    		[
    			1,
    			-18
    		],
    		[
    			1,
    			-8
    		],
    		[
    			0,
    			-14
    		],
    		[
    			1,
    			-5
    		],
    		[
    			1,
    			-22
    		],
    		[
    			2,
    			-25
    		],
    		[
    			1,
    			-10
    		],
    		[
    			0,
    			-6
    		],
    		[
    			1,
    			-27
    		],
    		[
    			2,
    			-30
    		],
    		[
    			0,
    			-11
    		],
    		[
    			0,
    			-43
    		],
    		[
    			-1,
    			-23
    		],
    		[
    			0,
    			-34
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-1,
    			-27
    		],
    		[
    			0,
    			-19
    		],
    		[
    			0,
    			-27
    		],
    		[
    			0,
    			-13
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			0,
    			-14
    		],
    		[
    			-1,
    			4
    		],
    		[
    			1,
    			6
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-1,
    			-15
    		],
    		[
    			0,
    			-5
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-1,
    			-13
    		],
    		[
    			0,
    			-19
    		],
    		[
    			1,
    			-3
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-2,
    			-16
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-3,
    			-10
    		],
    		[
    			-3,
    			0
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-2,
    			8
    		],
    		[
    			-1,
    			11
    		],
    		[
    			1,
    			19
    		],
    		[
    			1,
    			6
    		],
    		[
    			-1,
    			20
    		],
    		[
    			-2,
    			8
    		],
    		[
    			1,
    			5
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			10
    		],
    		[
    			-2,
    			14
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-1,
    			10
    		],
    		[
    			1,
    			8
    		],
    		[
    			-3,
    			10
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-2,
    			20
    		],
    		[
    			0,
    			9
    		],
    		[
    			-1,
    			15
    		],
    		[
    			-1,
    			28
    		],
    		[
    			0,
    			11
    		],
    		[
    			-1,
    			15
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-2,
    			6
    		],
    		[
    			0,
    			4
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			0,
    			11
    		],
    		[
    			0,
    			18
    		],
    		[
    			-2,
    			8
    		],
    		[
    			1,
    			4
    		],
    		[
    			1,
    			-1
    		],
    		[
    			0,
    			-6
    		],
    		[
    			2,
    			15
    		],
    		[
    			0,
    			11
    		],
    		[
    			0,
    			14
    		],
    		[
    			-1,
    			2
    		],
    		[
    			0,
    			13
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			1,
    			-12
    		],
    		[
    			0,
    			-12
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-1,
    			16
    		],
    		[
    			-3,
    			28
    		],
    		[
    			-1,
    			15
    		],
    		[
    			-2,
    			30
    		],
    		[
    			-4,
    			27
    		],
    		[
    			0,
    			10
    		],
    		[
    			1,
    			5
    		],
    		[
    			2,
    			13
    		],
    		[
    			2,
    			21
    		],
    		[
    			1,
    			3
    		],
    		[
    			0,
    			4
    		],
    		[
    			1,
    			4
    		],
    		[
    			1,
    			13
    		],
    		[
    			0,
    			12
    		],
    		[
    			-2,
    			4
    		],
    		[
    			0,
    			-11
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-2,
    			5
    		],
    		[
    			1,
    			5
    		],
    		[
    			0,
    			10
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			2,
    			-6
    		],
    		[
    			1,
    			-1
    		],
    		[
    			1,
    			-17
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			0,
    			-13
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			-2,
    			18
    		],
    		[
    			-1,
    			6
    		],
    		[
    			0,
    			12
    		],
    		[
    			0,
    			14
    		],
    		[
    			1,
    			-1
    		],
    		[
    			1,
    			18
    		],
    		[
    			0,
    			14
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			6
    		],
    		[
    			1,
    			6
    		],
    		[
    			0,
    			5
    		],
    		[
    			1,
    			9
    		],
    		[
    			0,
    			6
    		],
    		[
    			1,
    			8
    		],
    		[
    			0,
    			6
    		],
    		[
    			1,
    			8
    		],
    		[
    			0,
    			16
    		],
    		[
    			0,
    			11
    		],
    		[
    			0,
    			11
    		],
    		[
    			0,
    			9
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			7
    		],
    		[
    			-1,
    			17
    		],
    		[
    			1,
    			10
    		],
    		[
    			-1,
    			13
    		],
    		[
    			-1,
    			4
    		],
    		[
    			0,
    			11
    		],
    		[
    			-1,
    			10
    		],
    		[
    			0,
    			7
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-3,
    			1
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-2,
    			16
    		],
    		[
    			0,
    			9
    		],
    		[
    			-2,
    			4
    		],
    		[
    			0,
    			11
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-2,
    			3
    		],
    		[
    			0,
    			7
    		],
    		[
    			-3,
    			8
    		],
    		[
    			0,
    			18
    		],
    		[
    			0,
    			10
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-2,
    			12
    		],
    		[
    			0,
    			5
    		],
    		[
    			-1,
    			6
    		],
    		[
    			0,
    			8
    		],
    		[
    			-2,
    			7
    		],
    		[
    			-2,
    			10
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-2,
    			9
    		],
    		[
    			-3,
    			11
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-2,
    			1
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			0,
    			-13
    		],
    		[
    			0,
    			-2
    		],
    		[
    			0,
    			-10
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-3,
    			-13
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			0,
    			7
    		],
    		[
    			-1,
    			2
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-3,
    			1
    		],
    		[
    			-4,
    			-7
    		],
    		[
    			-2,
    			3
    		],
    		[
    			0,
    			18
    		],
    		[
    			-1,
    			19
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-3,
    			4
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-2,
    			12
    		],
    		[
    			-3,
    			7
    		],
    		[
    			-2,
    			11
    		],
    		[
    			-3,
    			12
    		],
    		[
    			-3,
    			10
    		],
    		[
    			-3,
    			6
    		],
    		[
    			-5,
    			11
    		],
    		[
    			-4,
    			3
    		],
    		[
    			-6,
    			3
    		],
    		[
    			-3,
    			0
    		],
    		[
    			-4,
    			-4
    		],
    		[
    			-7,
    			-8
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-6,
    			-8
    		]
    	],
    	[
    		[
    			2623,
    			2446
    		],
    		[
    			0,
    			-11
    		],
    		[
    			2,
    			-10
    		],
    		[
    			0,
    			-12
    		],
    		[
    			0,
    			-13
    		],
    		[
    			2,
    			-8
    		],
    		[
    			9,
    			-2
    		],
    		[
    			13,
    			-5
    		],
    		[
    			16,
    			-5
    		],
    		[
    			10,
    			-4
    		],
    		[
    			16,
    			-6
    		],
    		[
    			9,
    			-4
    		],
    		[
    			0,
    			-5
    		],
    		[
    			0,
    			-5
    		],
    		[
    			1,
    			-6
    		],
    		[
    			0,
    			-11
    		],
    		[
    			0,
    			-9
    		],
    		[
    			1,
    			-4
    		],
    		[
    			1,
    			2
    		],
    		[
    			2,
    			-1
    		],
    		[
    			0,
    			14
    		],
    		[
    			1,
    			7
    		],
    		[
    			0,
    			9
    		],
    		[
    			0,
    			8
    		],
    		[
    			0,
    			5
    		],
    		[
    			-1,
    			12
    		],
    		[
    			0,
    			9
    		],
    		[
    			0,
    			8
    		],
    		[
    			2,
    			6
    		],
    		[
    			1,
    			9
    		],
    		[
    			1,
    			-1
    		],
    		[
    			1,
    			-5
    		],
    		[
    			2,
    			-1
    		],
    		[
    			1,
    			-3
    		],
    		[
    			1,
    			-5
    		],
    		[
    			1,
    			0
    		],
    		[
    			4,
    			-6
    		],
    		[
    			2,
    			2
    		],
    		[
    			1,
    			-3
    		]
    	],
    	[
    		[
    			2642,
    			3193
    		],
    		[
    			5,
    			0
    		],
    		[
    			14,
    			0
    		],
    		[
    			0,
    			1
    		],
    		[
    			9,
    			0
    		],
    		[
    			5,
    			1
    		]
    	],
    	[
    		[
    			2675,
    			3195
    		],
    		[
    			0,
    			-11
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			1,
    			-6
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			0,
    			-8
    		],
    		[
    			2,
    			-9
    		],
    		[
    			1,
    			-5
    		],
    		[
    			2,
    			-4
    		],
    		[
    			2,
    			-11
    		],
    		[
    			1,
    			-5
    		],
    		[
    			1,
    			-6
    		],
    		[
    			1,
    			2
    		],
    		[
    			2,
    			1
    		],
    		[
    			1,
    			-6
    		],
    		[
    			1,
    			-17
    		],
    		[
    			1,
    			-5
    		],
    		[
    			1,
    			-10
    		],
    		[
    			1,
    			-3
    		],
    		[
    			0,
    			-16
    		],
    		[
    			0,
    			-6
    		],
    		[
    			2,
    			-3
    		],
    		[
    			1,
    			-9
    		],
    		[
    			0,
    			-3
    		],
    		[
    			1,
    			-7
    		],
    		[
    			1,
    			-16
    		],
    		[
    			1,
    			-2
    		],
    		[
    			1,
    			-5
    		],
    		[
    			2,
    			-9
    		],
    		[
    			2,
    			-5
    		],
    		[
    			2,
    			-14
    		],
    		[
    			1,
    			-11
    		],
    		[
    			1,
    			-7
    		],
    		[
    			0,
    			-6
    		],
    		[
    			2,
    			-8
    		],
    		[
    			2,
    			-5
    		],
    		[
    			1,
    			-6
    		],
    		[
    			1,
    			-8
    		],
    		[
    			1,
    			-5
    		],
    		[
    			1,
    			-4
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			0,
    			-12
    		],
    		[
    			1,
    			-4
    		],
    		[
    			2,
    			-3
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			1,
    			-4
    		],
    		[
    			2,
    			-6
    		],
    		[
    			0,
    			-7
    		],
    		[
    			2,
    			-9
    		],
    		[
    			1,
    			-4
    		],
    		[
    			1,
    			1
    		],
    		[
    			1,
    			-8
    		],
    		[
    			2,
    			-5
    		],
    		[
    			1,
    			-4
    		],
    		[
    			-1,
    			-13
    		],
    		[
    			1,
    			-8
    		],
    		[
    			1,
    			-8
    		],
    		[
    			0,
    			-3
    		],
    		[
    			1,
    			-16
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			1,
    			-5
    		],
    		[
    			0,
    			-11
    		],
    		[
    			1,
    			-7
    		],
    		[
    			2,
    			-4
    		],
    		[
    			1,
    			-4
    		],
    		[
    			2,
    			-13
    		],
    		[
    			0,
    			-8
    		],
    		[
    			0,
    			-12
    		],
    		[
    			1,
    			-6
    		],
    		[
    			1,
    			-8
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			1,
    			-10
    		],
    		[
    			0,
    			-13
    		],
    		[
    			1,
    			-6
    		],
    		[
    			2,
    			2
    		],
    		[
    			3,
    			-11
    		],
    		[
    			0,
    			-1
    		]
    	],
    	[
    		[
    			2737,
    			2640
    		],
    		[
    			2,
    			-4
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			1,
    			-1
    		],
    		[
    			-2,
    			-10
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			1,
    			-2
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-2,
    			2
    		],
    		[
    			0,
    			-6
    		],
    		[
    			1,
    			-5
    		],
    		[
    			1,
    			-10
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			0,
    			-5
    		],
    		[
    			2,
    			-2
    		],
    		[
    			-2,
    			-17
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			1,
    			-14
    		],
    		[
    			-1,
    			-16
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			0,
    			-11
    		],
    		[
    			0,
    			-11
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			2,
    			-4
    		],
    		[
    			1,
    			0
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-1,
    			-13
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-1,
    			-13
    		],
    		[
    			1,
    			-6
    		]
    	],
    	[
    		[
    			2606,
    			3192
    		],
    		[
    			6,
    			0
    		],
    		[
    			12,
    			1
    		],
    		[
    			18,
    			0
    		]
    	],
    	[
    		[
    			651,
    			434
    		],
    		[
    			1,
    			-3
    		],
    		[
    			0,
    			-5
    		],
    		[
    			2,
    			-7
    		],
    		[
    			3,
    			-8
    		],
    		[
    			0,
    			1
    		],
    		[
    			3,
    			-5
    		],
    		[
    			1,
    			-5
    		],
    		[
    			3,
    			-7
    		],
    		[
    			1,
    			-5
    		],
    		[
    			4,
    			-17
    		],
    		[
    			1,
    			-14
    		],
    		[
    			0,
    			-6
    		],
    		[
    			0,
    			-15
    		],
    		[
    			1,
    			-1
    		],
    		[
    			2,
    			2
    		],
    		[
    			0,
    			-9
    		],
    		[
    			0,
    			-10
    		],
    		[
    			1,
    			-2
    		],
    		[
    			0,
    			-4
    		],
    		[
    			1,
    			-7
    		],
    		[
    			3,
    			-7
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-2,
    			-10
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			0,
    			-3
    		],
    		[
    			-2,
    			-12
    		],
    		[
    			-2,
    			10
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-1,
    			16
    		],
    		[
    			1,
    			40
    		],
    		[
    			-1,
    			15
    		],
    		[
    			0,
    			5
    		],
    		[
    			0,
    			7
    		],
    		[
    			-1,
    			2
    		],
    		[
    			0,
    			18
    		],
    		[
    			-1,
    			11
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-1,
    			11
    		],
    		[
    			0,
    			9
    		],
    		[
    			2,
    			13
    		],
    		[
    			2,
    			1
    		],
    		[
    			2,
    			22
    		],
    		[
    			0,
    			1
    		],
    		[
    			1,
    			11
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-1,
    			13
    		],
    		[
    			0,
    			17
    		],
    		[
    			1,
    			6
    		],
    		[
    			2,
    			-4
    		]
    	],
    	[
    		[
    			530,
    			754
    		],
    		[
    			0,
    			7
    		],
    		[
    			2,
    			0
    		],
    		[
    			-1,
    			-13
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-1,
    			-15
    		],
    		[
    			-2,
    			5
    		],
    		[
    			1,
    			14
    		],
    		[
    			1,
    			7
    		],
    		[
    			2,
    			6
    		]
    	],
    	[
    		[
    			549,
    			803
    		],
    		[
    			1,
    			2
    		],
    		[
    			1,
    			-2
    		],
    		[
    			1,
    			-6
    		],
    		[
    			1,
    			-7
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			0,
    			-16
    		],
    		[
    			-3,
    			-17
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-4,
    			2
    		],
    		[
    			-1,
    			11
    		],
    		[
    			-3,
    			4
    		],
    		[
    			-1,
    			7
    		],
    		[
    			0,
    			9
    		],
    		[
    			1,
    			7
    		],
    		[
    			1,
    			8
    		],
    		[
    			2,
    			5
    		],
    		[
    			2,
    			10
    		],
    		[
    			1,
    			1
    		],
    		[
    			1,
    			-4
    		],
    		[
    			1,
    			5
    		],
    		[
    			1,
    			-3
    		]
    	],
    	[
    		[
    			617,
    			609
    		],
    		[
    			1,
    			5
    		],
    		[
    			0,
    			-6
    		],
    		[
    			3,
    			-2
    		],
    		[
    			2,
    			2
    		],
    		[
    			2,
    			-5
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-3,
    			-5
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-3,
    			8
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-3,
    			-1
    		],
    		[
    			-2,
    			3
    		],
    		[
    			1,
    			7
    		],
    		[
    			1,
    			5
    		],
    		[
    			0,
    			9
    		],
    		[
    			1,
    			0
    		],
    		[
    			2,
    			-4
    		],
    		[
    			4,
    			-3
    		]
    	],
    	[
    		[
    			630,
    			485
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-1,
    			4
    		],
    		[
    			1,
    			6
    		],
    		[
    			3,
    			9
    		],
    		[
    			1,
    			-5
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			1,
    			-4
    		]
    	],
    	[
    		[
    			628,
    			579
    		],
    		[
    			2,
    			-3
    		],
    		[
    			0,
    			-7
    		],
    		[
    			2,
    			-14
    		],
    		[
    			2,
    			5
    		],
    		[
    			2,
    			5
    		],
    		[
    			2,
    			-3
    		],
    		[
    			0,
    			-3
    		],
    		[
    			2,
    			-7
    		],
    		[
    			1,
    			-3
    		],
    		[
    			1,
    			-7
    		],
    		[
    			0,
    			1
    		],
    		[
    			1,
    			-4
    		],
    		[
    			2,
    			-3
    		],
    		[
    			0,
    			-5
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-3,
    			-8
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-1,
    			1
    		],
    		[
    			0,
    			5
    		],
    		[
    			-1,
    			21
    		],
    		[
    			0,
    			11
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-3,
    			8
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-1,
    			10
    		],
    		[
    			1,
    			6
    		],
    		[
    			0,
    			10
    		],
    		[
    			1,
    			4
    		],
    		[
    			1,
    			-1
    		]
    	],
    	[
    		[
    			617,
    			562
    		],
    		[
    			3,
    			-3
    		],
    		[
    			2,
    			-10
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-1,
    			10
    		],
    		[
    			0,
    			5
    		],
    		[
    			0,
    			7
    		],
    		[
    			-2,
    			5
    		],
    		[
    			0,
    			5
    		],
    		[
    			2,
    			5
    		]
    	],
    	[
    		[
    			588,
    			632
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-1,
    			14
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			9
    		],
    		[
    			-1,
    			7
    		],
    		[
    			0,
    			10
    		],
    		[
    			-1,
    			8
    		],
    		[
    			4,
    			1
    		],
    		[
    			1,
    			7
    		],
    		[
    			0,
    			6
    		],
    		[
    			2,
    			8
    		],
    		[
    			1,
    			2
    		],
    		[
    			1,
    			-11
    		],
    		[
    			0,
    			-5
    		],
    		[
    			3,
    			-18
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			1,
    			-7
    		],
    		[
    			1,
    			-6
    		],
    		[
    			0,
    			5
    		],
    		[
    			1,
    			1
    		],
    		[
    			0,
    			-7
    		],
    		[
    			1,
    			-8
    		],
    		[
    			0,
    			-5
    		],
    		[
    			2,
    			-10
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			0,
    			4
    		],
    		[
    			-3,
    			-5
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-2,
    			0
    		],
    		[
    			0,
    			4
    		],
    		[
    			-2,
    			-4
    		]
    	],
    	[
    		[
    			1897,
    			4505
    		],
    		[
    			-13,
    			0
    		],
    		[
    			-18,
    			0
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-12,
    			0
    		],
    		[
    			-17,
    			-1
    		],
    		[
    			-18,
    			-1
    		],
    		[
    			-4,
    			1
    		]
    	],
    	[
    		[
    			1814,
    			4504
    		],
    		[
    			-16,
    			0
    		],
    		[
    			-6,
    			2
    		],
    		[
    			-6,
    			-2
    		],
    		[
    			-8,
    			0
    		],
    		[
    			-15,
    			1
    		],
    		[
    			-14,
    			0
    		],
    		[
    			-17,
    			0
    		],
    		[
    			-1,
    			0
    		]
    	],
    	[
    		[
    			1731,
    			4505
    		],
    		[
    			0,
    			117
    		],
    		[
    			0,
    			75
    		],
    		[
    			0,
    			103
    		],
    		[
    			0,
    			48
    		],
    		[
    			1,
    			7
    		],
    		[
    			0,
    			10
    		],
    		[
    			0,
    			8
    		],
    		[
    			1,
    			11
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			7
    		],
    		[
    			1,
    			2
    		],
    		[
    			1,
    			10
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-1,
    			1
    		],
    		[
    			0,
    			9
    		],
    		[
    			-2,
    			1
    		],
    		[
    			0,
    			-3
    		],
    		[
    			-2,
    			9
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-2,
    			6
    		],
    		[
    			1,
    			9
    		],
    		[
    			-1,
    			11
    		],
    		[
    			0,
    			5
    		],
    		[
    			0,
    			10
    		],
    		[
    			2,
    			13
    		],
    		[
    			1,
    			13
    		],
    		[
    			2,
    			21
    		],
    		[
    			0,
    			3
    		],
    		[
    			3,
    			7
    		],
    		[
    			1,
    			12
    		],
    		[
    			1,
    			8
    		],
    		[
    			1,
    			8
    		],
    		[
    			-1,
    			9
    		],
    		[
    			1,
    			8
    		],
    		[
    			1,
    			7
    		],
    		[
    			0,
    			7
    		],
    		[
    			2,
    			8
    		],
    		[
    			1,
    			19
    		],
    		[
    			0,
    			6
    		],
    		[
    			0,
    			9
    		],
    		[
    			3,
    			23
    		],
    		[
    			1,
    			3
    		],
    		[
    			0,
    			9
    		],
    		[
    			2,
    			13
    		],
    		[
    			0,
    			7
    		],
    		[
    			-2,
    			14
    		],
    		[
    			0,
    			8
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-3,
    			1
    		],
    		[
    			0,
    			6
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-2,
    			15
    		],
    		[
    			0,
    			4
    		]
    	],
    	[
    		[
    			1734,
    			5253
    		],
    		[
    			-2,
    			19
    		],
    		[
    			1,
    			14
    		],
    		[
    			-1,
    			5
    		],
    		[
    			1,
    			5
    		],
    		[
    			-1,
    			13
    		],
    		[
    			-2,
    			10
    		],
    		[
    			0,
    			14
    		],
    		[
    			0,
    			52
    		],
    		[
    			0,
    			80
    		],
    		[
    			0,
    			65
    		],
    		[
    			0,
    			68
    		],
    		[
    			0,
    			54
    		],
    		[
    			0,
    			46
    		],
    		[
    			0,
    			117
    		]
    	],
    	[
    		[
    			1730,
    			5815
    		],
    		[
    			18,
    			0
    		],
    		[
    			10,
    			1
    		]
    	],
    	[
    		[
    			1758,
    			5816
    		],
    		[
    			0,
    			-94
    		],
    		[
    			0,
    			-98
    		],
    		[
    			4,
    			-25
    		],
    		[
    			1,
    			-3
    		],
    		[
    			0,
    			-8
    		],
    		[
    			1,
    			-6
    		],
    		[
    			3,
    			-11
    		],
    		[
    			0,
    			-7
    		],
    		[
    			1,
    			-6
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			1,
    			-5
    		],
    		[
    			1,
    			-14
    		],
    		[
    			-1,
    			0
    		],
    		[
    			0,
    			-6
    		],
    		[
    			3,
    			-7
    		],
    		[
    			2,
    			-6
    		],
    		[
    			0,
    			-9
    		],
    		[
    			4,
    			-8
    		],
    		[
    			2,
    			-1
    		],
    		[
    			2,
    			-20
    		],
    		[
    			2,
    			-3
    		],
    		[
    			3,
    			-16
    		],
    		[
    			1,
    			-15
    		],
    		[
    			1,
    			1
    		],
    		[
    			2,
    			-14
    		],
    		[
    			0,
    			-12
    		],
    		[
    			2,
    			-4
    		],
    		[
    			1,
    			-6
    		],
    		[
    			2,
    			-4
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			1,
    			-4
    		],
    		[
    			1,
    			4
    		],
    		[
    			0,
    			4
    		],
    		[
    			2,
    			-1
    		],
    		[
    			1,
    			-5
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			1,
    			-7
    		],
    		[
    			2,
    			0
    		],
    		[
    			2,
    			-2
    		],
    		[
    			1,
    			6
    		],
    		[
    			3,
    			0
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-1,
    			-19
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			0,
    			-10
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-1,
    			-18
    		],
    		[
    			0,
    			-13
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			2,
    			-5
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			1,
    			-10
    		],
    		[
    			1,
    			-2
    		],
    		[
    			1,
    			-5
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			1,
    			-10
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-2,
    			-14
    		],
    		[
    			2,
    			-10
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			1,
    			-6
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			2,
    			-5
    		],
    		[
    			1,
    			1
    		],
    		[
    			1,
    			-10
    		],
    		[
    			2,
    			-4
    		],
    		[
    			1,
    			-5
    		],
    		[
    			1,
    			4
    		],
    		[
    			1,
    			8
    		],
    		[
    			2,
    			5
    		],
    		[
    			1,
    			1
    		],
    		[
    			0,
    			5
    		],
    		[
    			2,
    			2
    		],
    		[
    			0,
    			6
    		],
    		[
    			2,
    			6
    		],
    		[
    			-1,
    			6
    		],
    		[
    			1,
    			3
    		],
    		[
    			2,
    			-5
    		],
    		[
    			1,
    			-7
    		],
    		[
    			2,
    			-8
    		],
    		[
    			0,
    			-15
    		],
    		[
    			1,
    			0
    		],
    		[
    			1,
    			-7
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			1,
    			-9
    		],
    		[
    			0,
    			-3
    		],
    		[
    			0,
    			-12
    		],
    		[
    			2,
    			-8
    		],
    		[
    			0,
    			-6
    		],
    		[
    			2,
    			-12
    		],
    		[
    			1,
    			-11
    		],
    		[
    			2,
    			-12
    		],
    		[
    			1,
    			-1
    		],
    		[
    			1,
    			-10
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			1,
    			-15
    		],
    		[
    			1,
    			-5
    		],
    		[
    			2,
    			-4
    		],
    		[
    			0,
    			-7
    		],
    		[
    			3,
    			8
    		],
    		[
    			2,
    			-7
    		],
    		[
    			1,
    			-3
    		],
    		[
    			1,
    			-8
    		],
    		[
    			0,
    			-6
    		],
    		[
    			1,
    			-3
    		],
    		[
    			0,
    			-12
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			2,
    			-14
    		],
    		[
    			1,
    			-14
    		],
    		[
    			1,
    			-6
    		],
    		[
    			2,
    			-4
    		],
    		[
    			1,
    			-7
    		],
    		[
    			1,
    			3
    		],
    		[
    			-1,
    			9
    		],
    		[
    			2,
    			11
    		],
    		[
    			2,
    			4
    		],
    		[
    			1,
    			-4
    		],
    		[
    			3,
    			0
    		],
    		[
    			2,
    			-4
    		],
    		[
    			0,
    			3
    		],
    		[
    			3,
    			-6
    		],
    		[
    			1,
    			9
    		],
    		[
    			0,
    			7
    		],
    		[
    			1,
    			1
    		],
    		[
    			1,
    			6
    		],
    		[
    			1,
    			0
    		],
    		[
    			1,
    			-7
    		],
    		[
    			2,
    			2
    		],
    		[
    			1,
    			-4
    		],
    		[
    			2,
    			5
    		],
    		[
    			1,
    			-2
    		],
    		[
    			1,
    			4
    		],
    		[
    			2,
    			1
    		],
    		[
    			2,
    			-10
    		],
    		[
    			3,
    			6
    		],
    		[
    			0,
    			3
    		],
    		[
    			2,
    			-2
    		],
    		[
    			1,
    			3
    		],
    		[
    			3,
    			-4
    		],
    		[
    			-1,
    			12
    		],
    		[
    			1,
    			11
    		],
    		[
    			0,
    			8
    		],
    		[
    			4,
    			4
    		],
    		[
    			0,
    			-1
    		],
    		[
    			3,
    			-19
    		],
    		[
    			0,
    			-8
    		],
    		[
    			1,
    			-2
    		],
    		[
    			1,
    			-6
    		],
    		[
    			1,
    			-8
    		],
    		[
    			2,
    			-4
    		]
    	],
    	[
    		[
    			1897,
    			4968
    		],
    		[
    			0,
    			-85
    		],
    		[
    			0,
    			-97
    		],
    		[
    			0,
    			-57
    		],
    		[
    			0,
    			-89
    		],
    		[
    			0,
    			-40
    		],
    		[
    			0,
    			-95
    		]
    	],
    	[
    		[
    			2545,
    			4597
    		],
    		[
    			0,
    			-20
    		],
    		[
    			-1,
    			-15
    		],
    		[
    			1,
    			-18
    		],
    		[
    			1,
    			-15
    		],
    		[
    			2,
    			-10
    		],
    		[
    			0,
    			-8
    		],
    		[
    			2,
    			-26
    		],
    		[
    			0,
    			-12
    		],
    		[
    			1,
    			-12
    		],
    		[
    			1,
    			-3
    		],
    		[
    			0,
    			-7
    		]
    	],
    	[
    		[
    			2552,
    			4451
    		],
    		[
    			0,
    			-110
    		],
    		[
    			0,
    			-50
    		],
    		[
    			0,
    			-74
    		],
    		[
    			0,
    			-58
    		],
    		[
    			0,
    			-50
    		],
    		[
    			0,
    			-100
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			1,
    			-12
    		],
    		[
    			-2,
    			-10
    		],
    		[
    			0,
    			-11
    		],
    		[
    			2,
    			-10
    		],
    		[
    			0,
    			-12
    		],
    		[
    			2,
    			-7
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			0,
    			-7
    		],
    		[
    			1,
    			-15
    		],
    		[
    			0,
    			-6
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-3,
    			-7
    		],
    		[
    			0,
    			-12
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			1,
    			-8
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			1,
    			-6
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			1,
    			-11
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			0,
    			-5
    		],
    		[
    			0,
    			-7
    		],
    		[
    			0,
    			-9
    		],
    		[
    			0,
    			-3
    		]
    	],
    	[
    		[
    			2538,
    			3719
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			1,
    			-17
    		],
    		[
    			1,
    			-9
    		],
    		[
    			0,
    			-7
    		],
    		[
    			0,
    			-3
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-4,
    			-4
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			0,
    			-5
    		],
    		[
    			2,
    			-11
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-1,
    			-15
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-2,
    			10
    		],
    		[
    			-3,
    			4
    		],
    		[
    			-2,
    			9
    		],
    		[
    			-3,
    			6
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-2,
    			-10
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			1,
    			-6
    		],
    		[
    			1,
    			-4
    		]
    	],
    	[
    		[
    			2508,
    			3566
    		],
    		[
    			-2,
    			0
    		],
    		[
    			0,
    			6
    		],
    		[
    			-2,
    			9
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			1,
    			-6
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-2,
    			9
    		],
    		[
    			0,
    			8
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-1,
    			14
    		],
    		[
    			0,
    			9
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			7
    		],
    		[
    			1,
    			8
    		],
    		[
    			1,
    			3
    		],
    		[
    			1,
    			10
    		],
    		[
    			-3,
    			26
    		],
    		[
    			0,
    			9
    		],
    		[
    			1,
    			2
    		],
    		[
    			-1,
    			8
    		],
    		[
    			0,
    			9
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-1,
    			2
    		],
    		[
    			0,
    			5
    		],
    		[
    			-2,
    			11
    		],
    		[
    			-2,
    			2
    		],
    		[
    			0,
    			4
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-1,
    			6
    		],
    		[
    			1,
    			10
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-2,
    			8
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-1,
    			12
    		],
    		[
    			0,
    			8
    		],
    		[
    			1,
    			10
    		],
    		[
    			1,
    			9
    		],
    		[
    			1,
    			19
    		],
    		[
    			2,
    			14
    		],
    		[
    			0,
    			12
    		],
    		[
    			0,
    			9
    		],
    		[
    			1,
    			11
    		],
    		[
    			1,
    			5
    		],
    		[
    			0,
    			9
    		],
    		[
    			-3,
    			14
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-3,
    			-18
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-1,
    			7
    		],
    		[
    			0,
    			12
    		],
    		[
    			-1,
    			12
    		],
    		[
    			0,
    			6
    		],
    		[
    			0,
    			13
    		],
    		[
    			-1,
    			18
    		],
    		[
    			-3,
    			16
    		],
    		[
    			-4,
    			16
    		],
    		[
    			-2,
    			8
    		],
    		[
    			0,
    			5
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-2,
    			11
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-3,
    			13
    		],
    		[
    			1,
    			10
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-1,
    			7
    		],
    		[
    			1,
    			7
    		],
    		[
    			-2,
    			23
    		],
    		[
    			0,
    			4
    		],
    		[
    			-1,
    			13
    		],
    		[
    			1,
    			20
    		],
    		[
    			1,
    			20
    		],
    		[
    			1,
    			7
    		]
    	],
    	[
    		[
    			2444,
    			4202
    		],
    		[
    			1,
    			2
    		],
    		[
    			0,
    			12
    		],
    		[
    			0,
    			11
    		],
    		[
    			-1,
    			5
    		],
    		[
    			2,
    			13
    		],
    		[
    			3,
    			5
    		],
    		[
    			1,
    			0
    		],
    		[
    			2,
    			6
    		],
    		[
    			0,
    			11
    		],
    		[
    			1,
    			10
    		],
    		[
    			0,
    			6
    		],
    		[
    			3,
    			18
    		],
    		[
    			1,
    			3
    		],
    		[
    			0,
    			21
    		],
    		[
    			0,
    			11
    		],
    		[
    			-1,
    			11
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-2,
    			14
    		],
    		[
    			1,
    			12
    		],
    		[
    			1,
    			20
    		],
    		[
    			2,
    			4
    		],
    		[
    			2,
    			-2
    		],
    		[
    			2,
    			6
    		],
    		[
    			3,
    			-1
    		],
    		[
    			2,
    			3
    		],
    		[
    			2,
    			9
    		],
    		[
    			1,
    			3
    		],
    		[
    			3,
    			-1
    		],
    		[
    			1,
    			8
    		],
    		[
    			2,
    			4
    		],
    		[
    			0,
    			11
    		],
    		[
    			1,
    			9
    		],
    		[
    			0,
    			7
    		],
    		[
    			1,
    			7
    		],
    		[
    			2,
    			6
    		],
    		[
    			1,
    			20
    		],
    		[
    			0,
    			10
    		],
    		[
    			1,
    			8
    		],
    		[
    			-1,
    			7
    		],
    		[
    			0,
    			14
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-5,
    			13
    		],
    		[
    			-1,
    			10
    		],
    		[
    			0,
    			9
    		],
    		[
    			-2,
    			11
    		],
    		[
    			-2,
    			6
    		],
    		[
    			0,
    			5
    		],
    		[
    			-3,
    			7
    		],
    		[
    			1,
    			5
    		]
    	],
    	[
    		[
    			2466,
    			4600
    		],
    		[
    			6,
    			0
    		],
    		[
    			9,
    			0
    		],
    		[
    			4,
    			0
    		],
    		[
    			8,
    			0
    		],
    		[
    			11,
    			-2
    		],
    		[
    			13,
    			-1
    		],
    		[
    			4,
    			1
    		],
    		[
    			15,
    			0
    		],
    		[
    			9,
    			-1
    		]
    	],
    	[
    		[
    			2628,
    			3963
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			1,
    			-13
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			1,
    			-4
    		],
    		[
    			1,
    			-1
    		],
    		[
    			1,
    			-6
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-1,
    			10
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			1,
    			-9
    		],
    		[
    			0,
    			-9
    		],
    		[
    			0,
    			-9
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-1,
    			-18
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			1,
    			-14
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-2,
    			8
    		],
    		[
    			-1,
    			8
    		],
    		[
    			0,
    			7
    		],
    		[
    			-2,
    			11
    		],
    		[
    			0,
    			-6
    		],
    		[
    			1,
    			-2
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			-14
    		],
    		[
    			1,
    			-6
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-1,
    			3
    		],
    		[
    			1,
    			7
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-1,
    			14
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-1,
    			-20
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-1,
    			10
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-2,
    			7
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			1,
    			-9
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-2,
    			0
    		],
    		[
    			1,
    			9
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-4,
    			-5
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			1,
    			-15
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-3,
    			5
    		]
    	],
    	[
    		[
    			2552,
    			4451
    		],
    		[
    			3,
    			-13
    		],
    		[
    			4,
    			-4
    		],
    		[
    			2,
    			1
    		],
    		[
    			3,
    			4
    		],
    		[
    			5,
    			12
    		],
    		[
    			3,
    			9
    		]
    	],
    	[
    		[
    			2572,
    			4460
    		],
    		[
    			8,
    			0
    		],
    		[
    			11,
    			0
    		],
    		[
    			10,
    			0
    		],
    		[
    			13,
    			0
    		],
    		[
    			14,
    			0
    		],
    		[
    			0,
    			-12
    		]
    	],
    	[
    		[
    			2628,
    			4448
    		],
    		[
    			0,
    			-48
    		],
    		[
    			0,
    			-84
    		],
    		[
    			0,
    			-35
    		],
    		[
    			0,
    			-92
    		],
    		[
    			0,
    			-93
    		],
    		[
    			0,
    			-63
    		],
    		[
    			0,
    			-70
    		]
    	],
    	[
    		[
    			2450,
    			4786
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			1,
    			-12
    		],
    		[
    			0,
    			-8
    		],
    		[
    			2,
    			-5
    		],
    		[
    			2,
    			-13
    		],
    		[
    			-2,
    			-10
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			0,
    			-16
    		],
    		[
    			1,
    			-14
    		],
    		[
    			0,
    			-11
    		],
    		[
    			1,
    			-5
    		],
    		[
    			0,
    			-10
    		],
    		[
    			1,
    			-13
    		],
    		[
    			0,
    			-4
    		],
    		[
    			3,
    			-9
    		],
    		[
    			6,
    			-9
    		],
    		[
    			3,
    			-18
    		],
    		[
    			0,
    			-7
    		]
    	],
    	[
    		[
    			2444,
    			4202
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-1,
    			6
    		],
    		[
    			0,
    			9
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-2,
    			8
    		],
    		[
    			0,
    			8
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-10,
    			-2
    		],
    		[
    			-18,
    			-3
    		],
    		[
    			-5,
    			0
    		],
    		[
    			-9,
    			-1
    		],
    		[
    			-8,
    			-1
    		],
    		[
    			-14,
    			-1
    		],
    		[
    			-13,
    			0
    		],
    		[
    			-14,
    			1
    		],
    		[
    			-14,
    			1
    		],
    		[
    			-7,
    			0
    		]
    	],
    	[
    		[
    			2323,
    			4240
    		],
    		[
    			0,
    			5
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-2,
    			10
    		],
    		[
    			2,
    			8
    		],
    		[
    			0,
    			17
    		],
    		[
    			1,
    			3
    		],
    		[
    			-1,
    			11
    		],
    		[
    			0,
    			6
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			17
    		],
    		[
    			0,
    			10
    		],
    		[
    			0,
    			8
    		],
    		[
    			-2,
    			2
    		],
    		[
    			1,
    			8
    		],
    		[
    			-1,
    			8
    		],
    		[
    			2,
    			0
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-1,
    			0
    		],
    		[
    			0,
    			27
    		],
    		[
    			-2,
    			1
    		],
    		[
    			1,
    			8
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			8
    		],
    		[
    			-1,
    			4
    		],
    		[
    			1,
    			9
    		],
    		[
    			-1,
    			9
    		],
    		[
    			1,
    			20
    		],
    		[
    			-1,
    			4
    		],
    		[
    			0,
    			6
    		],
    		[
    			-1,
    			9
    		],
    		[
    			0,
    			2
    		],
    		[
    			1,
    			11
    		],
    		[
    			-2,
    			1
    		],
    		[
    			0,
    			5
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-1,
    			1
    		],
    		[
    			0,
    			12
    		],
    		[
    			-2,
    			10
    		],
    		[
    			-1,
    			9
    		],
    		[
    			1,
    			3
    		],
    		[
    			0,
    			6
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			14
    		],
    		[
    			1,
    			7
    		],
    		[
    			0,
    			5
    		],
    		[
    			-2,
    			3
    		]
    	],
    	[
    		[
    			2304,
    			4597
    		],
    		[
    			-1,
    			0
    		],
    		[
    			0,
    			12
    		],
    		[
    			-1,
    			14
    		],
    		[
    			-2,
    			10
    		],
    		[
    			-1,
    			4
    		],
    		[
    			0,
    			6
    		],
    		[
    			1,
    			17
    		],
    		[
    			1,
    			3
    		],
    		[
    			1,
    			9
    		],
    		[
    			-1,
    			6
    		],
    		[
    			1,
    			7
    		],
    		[
    			0,
    			3
    		],
    		[
    			1,
    			6
    		],
    		[
    			-1,
    			3
    		],
    		[
    			2,
    			9
    		],
    		[
    			0,
    			8
    		],
    		[
    			-1,
    			6
    		],
    		[
    			0,
    			14
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-1,
    			13
    		],
    		[
    			2,
    			3
    		],
    		[
    			0,
    			15
    		],
    		[
    			-2,
    			8
    		],
    		[
    			0,
    			8
    		],
    		[
    			0,
    			4
    		],
    		[
    			4,
    			0
    		]
    	],
    	[
    		[
    			2304,
    			4786
    		],
    		[
    			20,
    			0
    		],
    		[
    			16,
    			0
    		],
    		[
    			19,
    			0
    		],
    		[
    			19,
    			0
    		],
    		[
    			14,
    			0
    		],
    		[
    			14,
    			0
    		],
    		[
    			10,
    			0
    		],
    		[
    			13,
    			0
    		],
    		[
    			21,
    			0
    		]
    	],
    	[
    		[
    			2148,
    			4131
    		],
    		[
    			18,
    			0
    		],
    		[
    			13,
    			0
    		],
    		[
    			13,
    			0
    		],
    		[
    			18,
    			0
    		],
    		[
    			12,
    			0
    		],
    		[
    			13,
    			0
    		],
    		[
    			10,
    			0
    		],
    		[
    			13,
    			0
    		],
    		[
    			16,
    			0
    		],
    		[
    			13,
    			0
    		],
    		[
    			12,
    			0
    		],
    		[
    			13,
    			0
    		],
    		[
    			10,
    			0
    		],
    		[
    			14,
    			0
    		]
    	],
    	[
    		[
    			2336,
    			4131
    		],
    		[
    			0,
    			-3
    		],
    		[
    			1,
    			-7
    		],
    		[
    			2,
    			-2
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			2,
    			-1
    		],
    		[
    			0,
    			-4
    		],
    		[
    			2,
    			-4
    		],
    		[
    			1,
    			1
    		],
    		[
    			1,
    			6
    		],
    		[
    			1,
    			0
    		],
    		[
    			1,
    			-2
    		],
    		[
    			0,
    			-6
    		],
    		[
    			1,
    			-4
    		],
    		[
    			1,
    			-5
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			1,
    			-13
    		],
    		[
    			-2,
    			4
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			0,
    			-8
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			0,
    			-7
    		],
    		[
    			2,
    			-8
    		],
    		[
    			0,
    			-6
    		],
    		[
    			1,
    			-3
    		],
    		[
    			2,
    			-11
    		],
    		[
    			1,
    			-16
    		],
    		[
    			1,
    			-6
    		],
    		[
    			1,
    			-11
    		],
    		[
    			1,
    			0
    		],
    		[
    			2,
    			-8
    		],
    		[
    			1,
    			3
    		],
    		[
    			1,
    			-5
    		],
    		[
    			1,
    			1
    		],
    		[
    			0,
    			-8
    		],
    		[
    			0,
    			-55
    		],
    		[
    			0,
    			-38
    		],
    		[
    			0,
    			-76
    		],
    		[
    			0,
    			-83
    		],
    		[
    			0,
    			-47
    		],
    		[
    			0,
    			-98
    		]
    	],
    	[
    		[
    			2355,
    			3569
    		],
    		[
    			-11,
    			0
    		],
    		[
    			-11,
    			0
    		],
    		[
    			-17,
    			0
    		],
    		[
    			-14,
    			0
    		],
    		[
    			-14,
    			0
    		],
    		[
    			-12,
    			0
    		],
    		[
    			-16,
    			0
    		],
    		[
    			-9,
    			0
    		],
    		[
    			-19,
    			0
    		],
    		[
    			-17,
    			0
    		],
    		[
    			-16,
    			1
    		],
    		[
    			-15,
    			-1
    		],
    		[
    			-17,
    			0
    		],
    		[
    			-19,
    			-1
    		]
    	],
    	[
    		[
    			2498,
    			3475
    		],
    		[
    			-2,
    			0
    		]
    	],
    	[
    		[
    			2496,
    			3475
    		],
    		[
    			-1,
    			10
    		],
    		[
    			1,
    			5
    		],
    		[
    			2,
    			-1
    		],
    		[
    			0,
    			-8
    		],
    		[
    			0,
    			-6
    		]
    	],
    	[
    		[
    			2707,
    			3670
    		],
    		[
    			-9,
    			-45
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-5,
    			-7
    		],
    		[
    			-6,
    			-20
    		],
    		[
    			0,
    			-12
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			1,
    			-5
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			-3,
    			-6
    		],
    		[
    			-3,
    			-1
    		],
    		[
    			-1,
    			-14
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-5,
    			-10
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-3,
    			0
    		],
    		[
    			-3,
    			-6
    		],
    		[
    			-1,
    			-6
    		]
    	],
    	[
    		[
    			2660,
    			3495
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-8,
    			2
    		],
    		[
    			-8,
    			0
    		],
    		[
    			-7,
    			1
    		],
    		[
    			-9,
    			1
    		],
    		[
    			-5,
    			3
    		],
    		[
    			-5,
    			1
    		],
    		[
    			-3,
    			0
    		],
    		[
    			-5,
    			-2
    		],
    		[
    			-9,
    			2
    		],
    		[
    			-6,
    			1
    		],
    		[
    			-8,
    			4
    		],
    		[
    			-5,
    			0
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			0,
    			3
    		],
    		[
    			-15,
    			-2
    		],
    		[
    			-8,
    			0
    		],
    		[
    			-13,
    			-1
    		],
    		[
    			0,
    			5
    		],
    		[
    			-6,
    			3
    		],
    		[
    			1,
    			-26
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-8,
    			1
    		],
    		[
    			-14,
    			0
    		],
    		[
    			-8,
    			0
    		],
    		[
    			-5,
    			1
    		],
    		[
    			-3,
    			-1
    		]
    	],
    	[
    		[
    			2500,
    			3476
    		],
    		[
    			1,
    			21
    		],
    		[
    			1,
    			4
    		],
    		[
    			2,
    			-13
    		],
    		[
    			1,
    			1
    		],
    		[
    			1,
    			11
    		],
    		[
    			1,
    			7
    		],
    		[
    			-1,
    			9
    		],
    		[
    			1,
    			8
    		],
    		[
    			1,
    			-1
    		],
    		[
    			0,
    			4
    		],
    		[
    			-2,
    			6
    		],
    		[
    			1,
    			6
    		],
    		[
    			1,
    			2
    		],
    		[
    			0,
    			7
    		],
    		[
    			1,
    			15
    		],
    		[
    			-1,
    			3
    		]
    	],
    	[
    		[
    			2628,
    			3963
    		],
    		[
    			2,
    			8
    		],
    		[
    			1,
    			-2
    		],
    		[
    			0,
    			-6
    		],
    		[
    			2,
    			-5
    		],
    		[
    			2,
    			1
    		],
    		[
    			0,
    			3
    		],
    		[
    			1,
    			-1
    		],
    		[
    			2,
    			5
    		],
    		[
    			1,
    			-5
    		],
    		[
    			0,
    			-6
    		],
    		[
    			2,
    			-4
    		],
    		[
    			1,
    			-6
    		],
    		[
    			1,
    			-10
    		],
    		[
    			1,
    			-11
    		],
    		[
    			0,
    			-13
    		],
    		[
    			1,
    			-4
    		],
    		[
    			4,
    			-6
    		],
    		[
    			2,
    			3
    		],
    		[
    			4,
    			-6
    		],
    		[
    			0,
    			-6
    		],
    		[
    			2,
    			-5
    		],
    		[
    			0,
    			-7
    		],
    		[
    			3,
    			-6
    		],
    		[
    			1,
    			2
    		],
    		[
    			0,
    			9
    		],
    		[
    			3,
    			3
    		],
    		[
    			1,
    			-5
    		],
    		[
    			3,
    			-3
    		],
    		[
    			2,
    			-5
    		],
    		[
    			0,
    			-7
    		],
    		[
    			2,
    			6
    		],
    		[
    			1,
    			-2
    		],
    		[
    			2,
    			2
    		],
    		[
    			1,
    			9
    		],
    		[
    			1,
    			4
    		],
    		[
    			1,
    			5
    		],
    		[
    			1,
    			0
    		],
    		[
    			2,
    			6
    		],
    		[
    			1,
    			-5
    		],
    		[
    			1,
    			-25
    		],
    		[
    			1,
    			-6
    		],
    		[
    			2,
    			-1
    		],
    		[
    			2,
    			-11
    		],
    		[
    			1,
    			-5
    		],
    		[
    			1,
    			-10
    		]
    	],
    	[
    		[
    			2690,
    			3835
    		],
    		[
    			0,
    			-14
    		],
    		[
    			0,
    			-5
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			1,
    			-3
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			0,
    			-6
    		],
    		[
    			1,
    			-6
    		],
    		[
    			1,
    			-7
    		],
    		[
    			1,
    			-13
    		],
    		[
    			1,
    			-4
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			3,
    			-9
    		],
    		[
    			0,
    			-12
    		],
    		[
    			2,
    			-6
    		],
    		[
    			0,
    			-9
    		],
    		[
    			1,
    			-10
    		],
    		[
    			1,
    			-6
    		],
    		[
    			2,
    			-5
    		],
    		[
    			1,
    			-7
    		],
    		[
    			1,
    			0
    		],
    		[
    			0,
    			-7
    		],
    		[
    			2,
    			-3
    		],
    		[
    			2,
    			0
    		]
    	],
    	[
    		[
    			2377,
    			2201
    		],
    		[
    			-2,
    			15
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			4
    		],
    		[
    			2,
    			9
    		],
    		[
    			1,
    			10
    		],
    		[
    			1,
    			13
    		],
    		[
    			1,
    			6
    		],
    		[
    			1,
    			9
    		],
    		[
    			0,
    			4
    		],
    		[
    			0,
    			4
    		],
    		[
    			0,
    			8
    		],
    		[
    			0,
    			10
    		],
    		[
    			0,
    			7
    		],
    		[
    			0,
    			9
    		],
    		[
    			-1,
    			8
    		],
    		[
    			0,
    			10
    		],
    		[
    			1,
    			10
    		],
    		[
    			0,
    			19
    		],
    		[
    			0,
    			6
    		],
    		[
    			1,
    			4
    		],
    		[
    			0,
    			8
    		],
    		[
    			2,
    			10
    		],
    		[
    			1,
    			17
    		],
    		[
    			0,
    			8
    		],
    		[
    			0,
    			11
    		],
    		[
    			1,
    			10
    		],
    		[
    			-1,
    			7
    		],
    		[
    			0,
    			5
    		],
    		[
    			2,
    			4
    		],
    		[
    			-1,
    			11
    		],
    		[
    			0,
    			19
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			0,
    			18
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			7
    		],
    		[
    			0,
    			10
    		],
    		[
    			-1,
    			14
    		],
    		[
    			-1,
    			6
    		],
    		[
    			1,
    			7
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			10
    		],
    		[
    			0,
    			3
    		],
    		[
    			0,
    			8
    		],
    		[
    			1,
    			4
    		],
    		[
    			-1,
    			11
    		],
    		[
    			0,
    			5
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-1,
    			15
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-1,
    			12
    		],
    		[
    			-1,
    			1
    		],
    		[
    			0,
    			82
    		],
    		[
    			0,
    			109
    		]
    	],
    	[
    		[
    			2451,
    			2821
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			0,
    			-7
    		],
    		[
    			1,
    			-4
    		],
    		[
    			1,
    			6
    		],
    		[
    			0,
    			9
    		],
    		[
    			1,
    			-1
    		],
    		[
    			1,
    			-9
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			0,
    			-12
    		],
    		[
    			3,
    			-4
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			1,
    			-6
    		],
    		[
    			0,
    			-4
    		],
    		[
    			2,
    			4
    		],
    		[
    			1,
    			-5
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			1,
    			-5
    		],
    		[
    			2,
    			-5
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-2,
    			11
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			1,
    			-8
    		],
    		[
    			2,
    			-4
    		],
    		[
    			1,
    			3
    		],
    		[
    			1,
    			-3
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			0,
    			-7
    		],
    		[
    			0,
    			-3
    		],
    		[
    			2,
    			-2
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			1,
    			-3
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			0,
    			-7
    		],
    		[
    			0,
    			-5
    		],
    		[
    			3,
    			-1
    		],
    		[
    			0,
    			10
    		],
    		[
    			1,
    			-4
    		],
    		[
    			0,
    			-11
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			0,
    			-7
    		],
    		[
    			1,
    			-4
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-1,
    			-17
    		],
    		[
    			3,
    			2
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-3,
    			0
    		],
    		[
    			0,
    			-6
    		],
    		[
    			0,
    			-13
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			1,
    			-5
    		],
    		[
    			2,
    			2
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			0,
    			-16
    		],
    		[
    			1,
    			-10
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			11
    		],
    		[
    			0,
    			-6
    		],
    		[
    			0,
    			-4
    		],
    		[
    			0,
    			-6
    		],
    		[
    			1,
    			-5
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-2,
    			1
    		],
    		[
    			0,
    			-6
    		],
    		[
    			1,
    			-7
    		],
    		[
    			-1,
    			-15
    		],
    		[
    			2,
    			-8
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			16,
    			0
    		],
    		[
    			9,
    			0
    		],
    		[
    			10,
    			0
    		],
    		[
    			17,
    			1
    		],
    		[
    			1,
    			-2
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			0,
    			-6
    		],
    		[
    			0,
    			-3
    		],
    		[
    			-1,
    			-18
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			0,
    			-8
    		],
    		[
    			0,
    			-10
    		],
    		[
    			0,
    			-4
    		],
    		[
    			1,
    			-10
    		],
    		[
    			1,
    			-15
    		],
    		[
    			1,
    			-5
    		],
    		[
    			1,
    			-7
    		],
    		[
    			0,
    			-9
    		],
    		[
    			1,
    			-9
    		],
    		[
    			1,
    			-3
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			1,
    			-14
    		],
    		[
    			1,
    			-9
    		],
    		[
    			2,
    			0
    		]
    	],
    	[
    		[
    			2497,
    			2293
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			1,
    			-11
    		],
    		[
    			2,
    			-2
    		],
    		[
    			2,
    			-12
    		],
    		[
    			2,
    			-1
    		],
    		[
    			1,
    			3
    		],
    		[
    			0,
    			15
    		],
    		[
    			0,
    			6
    		],
    		[
    			3,
    			9
    		],
    		[
    			0,
    			7
    		],
    		[
    			3,
    			-8
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			0,
    			-6
    		],
    		[
    			2,
    			-3
    		],
    		[
    			0,
    			-9
    		],
    		[
    			2,
    			2
    		],
    		[
    			1,
    			13
    		],
    		[
    			1,
    			-4
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			2,
    			2
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-3,
    			-4
    		],
    		[
    			1,
    			-12
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-2,
    			7
    		],
    		[
    			-4,
    			1
    		],
    		[
    			0,
    			-7
    		],
    		[
    			3,
    			-8
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			0
    		],
    		[
    			1,
    			-8
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			0,
    			-10
    		],
    		[
    			2,
    			-3
    		],
    		[
    			1,
    			-9
    		],
    		[
    			1,
    			4
    		],
    		[
    			1,
    			-15
    		],
    		[
    			2,
    			2
    		],
    		[
    			2,
    			-1
    		],
    		[
    			1,
    			-2
    		],
    		[
    			0,
    			-7
    		],
    		[
    			1,
    			3
    		],
    		[
    			2,
    			-9
    		],
    		[
    			1,
    			7
    		],
    		[
    			1,
    			-8
    		],
    		[
    			2,
    			-10
    		],
    		[
    			0,
    			-10
    		],
    		[
    			2,
    			4
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			1,
    			-6
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			-2,
    			6
    		],
    		[
    			0,
    			5
    		],
    		[
    			-3,
    			-5
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-1,
    			2
    		],
    		[
    			0,
    			8
    		],
    		[
    			-2,
    			16
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-3,
    			1
    		],
    		[
    			0,
    			5
    		],
    		[
    			1,
    			9
    		],
    		[
    			-1,
    			9
    		],
    		[
    			0,
    			9
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			0,
    			-20
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			1,
    			-6
    		],
    		[
    			1,
    			1
    		],
    		[
    			-2,
    			-12
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			0,
    			8
    		],
    		[
    			-2,
    			9
    		],
    		[
    			1,
    			5
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			-13
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-1,
    			4
    		],
    		[
    			1,
    			10
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			1,
    			-4
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-2,
    			0
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			0,
    			-2
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-2,
    			12
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-2,
    			10
    		],
    		[
    			2,
    			2
    		],
    		[
    			0,
    			10
    		],
    		[
    			2,
    			1
    		],
    		[
    			-1,
    			13
    		],
    		[
    			-1,
    			2
    		],
    		[
    			0,
    			4
    		],
    		[
    			-2,
    			3
    		],
    		[
    			0,
    			5
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			0,
    			7
    		],
    		[
    			-1,
    			12
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			0,
    			21
    		],
    		[
    			-3,
    			2
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-1,
    			1
    		],
    		[
    			0,
    			9
    		],
    		[
    			1,
    			9
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-3,
    			-8
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			1,
    			-15
    		],
    		[
    			2,
    			1
    		],
    		[
    			1,
    			-2
    		],
    		[
    			1,
    			-1
    		],
    		[
    			1,
    			5
    		],
    		[
    			2,
    			-1
    		],
    		[
    			1,
    			-5
    		],
    		[
    			3,
    			-9
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-3,
    			7
    		],
    		[
    			-2,
    			8
    		],
    		[
    			-4,
    			0
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-5,
    			4
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-3,
    			6
    		],
    		[
    			-6,
    			18
    		],
    		[
    			-4,
    			6
    		],
    		[
    			-3,
    			6
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-3,
    			1
    		],
    		[
    			-6,
    			-4
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-2,
    			-9
    		]
    	],
    	[
    		[
    			3084,
    			4915
    		],
    		[
    			1,
    			0
    		],
    		[
    			1,
    			-6
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-1,
    			8
    		],
    		[
    			1,
    			5
    		]
    	],
    	[
    		[
    			3077,
    			4932
    		],
    		[
    			2,
    			-5
    		],
    		[
    			1,
    			-4
    		],
    		[
    			-2,
    			-14
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			3
    		],
    		[
    			1,
    			21
    		]
    	],
    	[
    		[
    			3083,
    			4949
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-1,
    			3
    		],
    		[
    			1,
    			7
    		]
    	],
    	[
    		[
    			3079,
    			4882
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			7
    		],
    		[
    			1,
    			3
    		],
    		[
    			1,
    			-7
    		],
    		[
    			-1,
    			-8
    		]
    	],
    	[
    		[
    			3075,
    			4890
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-1,
    			5
    		],
    		[
    			1,
    			7
    		],
    		[
    			2,
    			7
    		],
    		[
    			1,
    			-9
    		],
    		[
    			1,
    			-12
    		],
    		[
    			0,
    			-3
    		]
    	],
    	[
    		[
    			3107,
    			4977
    		],
    		[
    			2,
    			-9
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-1,
    			13
    		]
    	],
    	[
    		[
    			3070,
    			4932
    		],
    		[
    			1,
    			6
    		],
    		[
    			0,
    			12
    		],
    		[
    			1,
    			-2
    		],
    		[
    			0,
    			-6
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			-1,
    			3
    		],
    		[
    			0,
    			4
    		]
    	],
    	[
    		[
    			3021,
    			4706
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-2,
    			10
    		],
    		[
    			0,
    			21
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-1,
    			13
    		],
    		[
    			1,
    			4
    		],
    		[
    			0,
    			9
    		],
    		[
    			0,
    			12
    		],
    		[
    			0,
    			4
    		],
    		[
    			-1,
    			42
    		],
    		[
    			0,
    			23
    		],
    		[
    			0,
    			72
    		],
    		[
    			-1,
    			66
    		],
    		[
    			-1,
    			66
    		],
    		[
    			0,
    			45
    		],
    		[
    			-1,
    			11
    		]
    	],
    	[
    		[
    			3010,
    			5124
    		],
    		[
    			4,
    			5
    		],
    		[
    			1,
    			-4
    		],
    		[
    			0,
    			-6
    		],
    		[
    			1,
    			-8
    		],
    		[
    			2,
    			12
    		],
    		[
    			0,
    			7
    		],
    		[
    			0,
    			7
    		],
    		[
    			0,
    			5
    		],
    		[
    			1,
    			5
    		],
    		[
    			1,
    			0
    		],
    		[
    			1,
    			-7
    		],
    		[
    			2,
    			-2
    		],
    		[
    			0,
    			7
    		],
    		[
    			-2,
    			13
    		],
    		[
    			0,
    			5
    		],
    		[
    			2,
    			17
    		],
    		[
    			1,
    			5
    		],
    		[
    			1,
    			6
    		],
    		[
    			1,
    			0
    		],
    		[
    			2,
    			7
    		],
    		[
    			0,
    			1
    		],
    		[
    			2,
    			5
    		],
    		[
    			-1,
    			12
    		],
    		[
    			2,
    			10
    		],
    		[
    			2,
    			7
    		],
    		[
    			0,
    			14
    		],
    		[
    			-1,
    			0
    		],
    		[
    			0,
    			11
    		],
    		[
    			1,
    			6
    		],
    		[
    			-1,
    			2
    		],
    		[
    			2,
    			8
    		],
    		[
    			0,
    			7
    		],
    		[
    			-1,
    			9
    		],
    		[
    			1,
    			14
    		],
    		[
    			1,
    			6
    		],
    		[
    			0,
    			5
    		],
    		[
    			2,
    			6
    		],
    		[
    			1,
    			10
    		],
    		[
    			1,
    			1
    		],
    		[
    			2,
    			52
    		],
    		[
    			12,
    			80
    		],
    		[
    			9,
    			63
    		],
    		[
    			2,
    			-1
    		],
    		[
    			4,
    			-9
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			0,
    			-15
    		],
    		[
    			0,
    			-10
    		],
    		[
    			4,
    			-12
    		],
    		[
    			3,
    			6
    		],
    		[
    			2,
    			5
    		],
    		[
    			3,
    			1
    		],
    		[
    			1,
    			8
    		],
    		[
    			2,
    			2
    		],
    		[
    			2,
    			-3
    		],
    		[
    			2,
    			3
    		],
    		[
    			0,
    			8
    		],
    		[
    			1,
    			3
    		],
    		[
    			3,
    			-2
    		],
    		[
    			2,
    			-5
    		],
    		[
    			1,
    			-5
    		],
    		[
    			3,
    			-10
    		],
    		[
    			2,
    			-8
    		],
    		[
    			2,
    			-18
    		],
    		[
    			2,
    			-6
    		],
    		[
    			0,
    			-88
    		],
    		[
    			0,
    			-60
    		],
    		[
    			0,
    			-63
    		],
    		[
    			1,
    			-5
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			1,
    			-11
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			0,
    			-14
    		],
    		[
    			0,
    			-9
    		],
    		[
    			2,
    			-3
    		],
    		[
    			2,
    			-9
    		],
    		[
    			4,
    			-5
    		],
    		[
    			2,
    			3
    		],
    		[
    			0,
    			-5
    		],
    		[
    			0,
    			-14
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			1,
    			-11
    		],
    		[
    			2,
    			-10
    		],
    		[
    			-2,
    			-15
    		],
    		[
    			0,
    			-3
    		],
    		[
    			1,
    			-10
    		],
    		[
    			1,
    			-12
    		],
    		[
    			2,
    			-7
    		],
    		[
    			1,
    			4
    		],
    		[
    			1,
    			8
    		],
    		[
    			1,
    			-5
    		],
    		[
    			2,
    			0
    		],
    		[
    			1,
    			-9
    		],
    		[
    			1,
    			-16
    		],
    		[
    			1,
    			-16
    		],
    		[
    			2,
    			-6
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			1,
    			-7
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-1,
    			6
    		],
    		[
    			0,
    			9
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			0,
    			-5
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-2,
    			8
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			0,
    			1
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			1,
    			-8
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-3,
    			-13
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-1,
    			10
    		],
    		[
    			0,
    			14
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			3,
    			-15
    		],
    		[
    			1,
    			-8
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			0,
    			-5
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-3,
    			5
    		],
    		[
    			-1,
    			11
    		],
    		[
    			1,
    			12
    		],
    		[
    			-1,
    			12
    		],
    		[
    			0,
    			1
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			-1,
    			-15
    		],
    		[
    			1,
    			-10
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-3,
    			5
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-1,
    			1
    		],
    		[
    			1,
    			9
    		],
    		[
    			0,
    			9
    		],
    		[
    			1,
    			12
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			1,
    			-11
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-3,
    			-15
    		],
    		[
    			0,
    			-11
    		],
    		[
    			-1,
    			-13
    		],
    		[
    			1,
    			-6
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-3,
    			-12
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			0,
    			7
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-2,
    			-13
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-3,
    			-7
    		],
    		[
    			-1,
    			11
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-1,
    			3
    		],
    		[
    			1,
    			8
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-4,
    			-10
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			1,
    			-11
    		],
    		[
    			0,
    			-5
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			0,
    			-11
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-2,
    			-12
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			1,
    			-5
    		],
    		[
    			-2,
    			-11
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-1,
    			0
    		]
    	],
    	[
    		[
    			2872,
    			3779
    		],
    		[
    			-1,
    			1
    		],
    		[
    			0,
    			13
    		],
    		[
    			1,
    			2
    		],
    		[
    			1,
    			-5
    		],
    		[
    			0,
    			-6
    		],
    		[
    			0,
    			-5
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-1,
    			4
    		],
    		[
    			0,
    			5
    		]
    	],
    	[
    		[
    			2872,
    			3748
    		],
    		[
    			0,
    			15
    		],
    		[
    			2,
    			-3
    		],
    		[
    			0,
    			-12
    		]
    	],
    	[
    		[
    			2874,
    			3748
    		],
    		[
    			-2,
    			0
    		]
    	],
    	[
    		[
    			2842,
    			3931
    		],
    		[
    			0,
    			6
    		],
    		[
    			-3,
    			1
    		],
    		[
    			0,
    			3
    		],
    		[
    			0,
    			6
    		],
    		[
    			-3,
    			8
    		],
    		[
    			-3,
    			3
    		],
    		[
    			-2,
    			13
    		],
    		[
    			2,
    			15
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-1,
    			0
    		]
    	],
    	[
    		[
    			2826,
    			4004
    		],
    		[
    			-1,
    			2
    		],
    		[
    			0,
    			17
    		],
    		[
    			-1,
    			4
    		],
    		[
    			0,
    			8
    		],
    		[
    			-3,
    			12
    		],
    		[
    			1,
    			2
    		],
    		[
    			0,
    			8
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-3,
    			3
    		],
    		[
    			0,
    			6
    		],
    		[
    			-2,
    			8
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-2,
    			-10
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			1,
    			-3
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-3,
    			0
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-3,
    			11
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-2,
    			-12
    		],
    		[
    			-2,
    			-12
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-3,
    			-15
    		],
    		[
    			-4,
    			-14
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			1,
    			59
    		],
    		[
    			0,
    			2
    		],
    		[
    			0,
    			36
    		]
    	],
    	[
    		[
    			2777,
    			4079
    		],
    		[
    			12,
    			0
    		],
    		[
    			14,
    			0
    		],
    		[
    			13,
    			0
    		],
    		[
    			15,
    			-1
    		],
    		[
    			15,
    			0
    		],
    		[
    			16,
    			1
    		],
    		[
    			17,
    			0
    		]
    	],
    	[
    		[
    			2900,
    			3841
    		],
    		[
    			-1,
    			-24
    		],
    		[
    			0,
    			-2
    		],
    		[
    			-3,
    			-40
    		],
    		[
    			-1,
    			-13
    		]
    	],
    	[
    		[
    			2895,
    			3762
    		],
    		[
    			-11,
    			-7
    		],
    		[
    			-1,
    			-8
    		]
    	],
    	[
    		[
    			2883,
    			3747
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-3,
    			-10
    		],
    		[
    			-1,
    			2
    		],
    		[
    			0,
    			9
    		],
    		[
    			1,
    			7
    		],
    		[
    			2,
    			9
    		],
    		[
    			-2,
    			3
    		],
    		[
    			1,
    			7
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			0,
    			10
    		],
    		[
    			3,
    			4
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-1,
    			8
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-2,
    			9
    		],
    		[
    			2,
    			4
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-1,
    			2
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			1,
    			-4
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-2,
    			3
    		],
    		[
    			0,
    			18
    		],
    		[
    			-2,
    			15
    		],
    		[
    			2,
    			2
    		],
    		[
    			1,
    			4
    		],
    		[
    			-2,
    			8
    		],
    		[
    			1,
    			8
    		],
    		[
    			1,
    			3
    		],
    		[
    			1,
    			-4
    		],
    		[
    			1,
    			6
    		],
    		[
    			0,
    			7
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-2,
    			12
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-1,
    			8
    		],
    		[
    			1,
    			10
    		],
    		[
    			1,
    			4
    		],
    		[
    			1,
    			-6
    		],
    		[
    			1,
    			3
    		],
    		[
    			0,
    			6
    		],
    		[
    			0,
    			12
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-1,
    			6
    		],
    		[
    			2,
    			17
    		],
    		[
    			1,
    			-9
    		],
    		[
    			2,
    			-1
    		],
    		[
    			1,
    			5
    		],
    		[
    			-1,
    			8
    		],
    		[
    			1,
    			9
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			14
    		],
    		[
    			0,
    			2
    		],
    		[
    			1,
    			22
    		],
    		[
    			1,
    			4
    		],
    		[
    			1,
    			9
    		],
    		[
    			1,
    			7
    		],
    		[
    			2,
    			0
    		],
    		[
    			1,
    			6
    		],
    		[
    			1,
    			9
    		],
    		[
    			0,
    			5
    		],
    		[
    			0,
    			12
    		],
    		[
    			0,
    			3
    		],
    		[
    			-3,
    			-4
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			2,
    			-4
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-2,
    			-11
    		],
    		[
    			-4,
    			-11
    		],
    		[
    			0,
    			6
    		],
    		[
    			-1,
    			1
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			1,
    			-4
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			3,
    			-11
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			2,
    			-8
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			1,
    			-6
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			1,
    			-4
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			1,
    			-8
    		],
    		[
    			0,
    			-9
    		],
    		[
    			0,
    			-11
    		],
    		[
    			0,
    			-16
    		],
    		[
    			1,
    			-9
    		],
    		[
    			3,
    			-18
    		],
    		[
    			-1,
    			-14
    		],
    		[
    			1,
    			-3
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			1,
    			-8
    		],
    		[
    			2,
    			-15
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			1,
    			-14
    		],
    		[
    			-2,
    			3
    		],
    		[
    			0,
    			8
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-2,
    			7
    		],
    		[
    			0,
    			7
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-4,
    			1
    		],
    		[
    			0,
    			8
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-1,
    			4
    		],
    		[
    			0,
    			6
    		],
    		[
    			-2,
    			5
    		],
    		[
    			0,
    			8
    		],
    		[
    			-1,
    			10
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-3,
    			-9
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-1,
    			19
    		],
    		[
    			1,
    			13
    		],
    		[
    			2,
    			9
    		],
    		[
    			1,
    			1
    		],
    		[
    			0,
    			5
    		]
    	],
    	[
    		[
    			2842,
    			3875
    		],
    		[
    			0,
    			8
    		],
    		[
    			1,
    			4
    		],
    		[
    			1,
    			4
    		],
    		[
    			1,
    			14
    		]
    	],
    	[
    		[
    			3024,
    			4406
    		],
    		[
    			1,
    			0
    		],
    		[
    			0,
    			-10
    		],
    		[
    			2,
    			-6
    		],
    		[
    			1,
    			2
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-4,
    			0
    		],
    		[
    			-3,
    			-1
    		],
    		[
    			-3,
    			-5
    		],
    		[
    			-1,
    			6
    		],
    		[
    			2,
    			1
    		],
    		[
    			3,
    			17
    		],
    		[
    			2,
    			5
    		]
    	],
    	[
    		[
    			3038,
    			4374
    		],
    		[
    			1,
    			2
    		],
    		[
    			1,
    			11
    		],
    		[
    			2,
    			-17
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-3,
    			0
    		],
    		[
    			-3,
    			9
    		],
    		[
    			4,
    			2
    		]
    	],
    	[
    		[
    			2972,
    			4641
    		],
    		[
    			13,
    			-2
    		],
    		[
    			20,
    			-3
    		],
    		[
    			1,
    			8
    		],
    		[
    			2,
    			-1
    		],
    		[
    			0,
    			10
    		],
    		[
    			1,
    			6
    		],
    		[
    			2,
    			-3
    		],
    		[
    			1,
    			10
    		],
    		[
    			3,
    			5
    		],
    		[
    			1,
    			-1
    		],
    		[
    			1,
    			-4
    		],
    		[
    			1,
    			2
    		]
    	],
    	[
    		[
    			3018,
    			4668
    		],
    		[
    			0,
    			-16
    		],
    		[
    			1,
    			-15
    		],
    		[
    			1,
    			-8
    		],
    		[
    			1,
    			-2
    		],
    		[
    			2,
    			7
    		],
    		[
    			1,
    			-10
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-4,
    			-4
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			1,
    			-10
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			1,
    			-13
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			1,
    			-11
    		],
    		[
    			2,
    			0
    		],
    		[
    			1,
    			8
    		],
    		[
    			1,
    			-8
    		],
    		[
    			2,
    			-3
    		],
    		[
    			2,
    			-8
    		],
    		[
    			0,
    			-7
    		],
    		[
    			2,
    			-15
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			1,
    			-9
    		],
    		[
    			2,
    			-4
    		],
    		[
    			0,
    			2
    		],
    		[
    			1,
    			-4
    		],
    		[
    			1,
    			-13
    		],
    		[
    			0,
    			-8
    		],
    		[
    			2,
    			-10
    		],
    		[
    			2,
    			-5
    		],
    		[
    			3,
    			-1
    		],
    		[
    			0,
    			-3
    		],
    		[
    			2,
    			7
    		],
    		[
    			2,
    			1
    		],
    		[
    			3,
    			5
    		],
    		[
    			1,
    			4
    		],
    		[
    			-1,
    			13
    		],
    		[
    			0,
    			10
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			15
    		],
    		[
    			0,
    			6
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-1,
    			6
    		],
    		[
    			1,
    			4
    		],
    		[
    			2,
    			-3
    		],
    		[
    			3,
    			-9
    		],
    		[
    			1,
    			-13
    		],
    		[
    			1,
    			-26
    		],
    		[
    			1,
    			-23
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-3,
    			-1
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-3,
    			0
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			-4,
    			-2
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			0,
    			3
    		],
    		[
    			2,
    			8
    		],
    		[
    			1,
    			7
    		],
    		[
    			0,
    			4
    		],
    		[
    			0,
    			10
    		],
    		[
    			0,
    			7
    		],
    		[
    			0,
    			3
    		],
    		[
    			-2,
    			5
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			0,
    			-13
    		],
    		[
    			-3,
    			-8
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-1,
    			-2
    		]
    	],
    	[
    		[
    			3009,
    			4411
    		],
    		[
    			0,
    			31
    		],
    		[
    			-2,
    			2
    		]
    	],
    	[
    		[
    			3007,
    			4444
    		],
    		[
    			0,
    			7
    		]
    	],
    	[
    		[
    			3007,
    			4451
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-1,
    			8
    		],
    		[
    			0,
    			14
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			0,
    			24
    		],
    		[
    			-11,
    			-2
    		]
    	],
    	[
    		[
    			2944,
    			4514
    		],
    		[
    			-1,
    			7
    		],
    		[
    			4,
    			80
    		],
    		[
    			3,
    			44
    		]
    	],
    	[
    		[
    			2950,
    			4645
    		],
    		[
    			12,
    			-2
    		],
    		[
    			10,
    			-2
    		]
    	],
    	[
    		[
    			2592,
    			5068
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			0,
    			7
    		],
    		[
    			1,
    			0
    		],
    		[
    			0,
    			-6
    		]
    	],
    	[
    		[
    			2594,
    			5096
    		],
    		[
    			2,
    			-3
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-2,
    			7
    		],
    		[
    			0,
    			7
    		],
    		[
    			1,
    			3
    		]
    	],
    	[
    		[
    			2520,
    			5650
    		],
    		[
    			1,
    			4
    		],
    		[
    			3,
    			7
    		],
    		[
    			3,
    			-2
    		],
    		[
    			-4,
    			-15
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			-5,
    			-8
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			0,
    			-4
    		],
    		[
    			2,
    			-2
    		],
    		[
    			-4,
    			-7
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-2,
    			8
    		],
    		[
    			2,
    			11
    		],
    		[
    			3,
    			6
    		],
    		[
    			7,
    			17
    		],
    		[
    			1,
    			0
    		],
    		[
    			2,
    			8
    		],
    		[
    			1,
    			3
    		]
    	],
    	[
    		[
    			2634,
    			5223
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			4
    		],
    		[
    			1,
    			-11
    		],
    		[
    			7,
    			-10
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-2,
    			10
    		],
    		[
    			-1,
    			8
    		]
    	],
    	[
    		[
    			2608,
    			5222
    		],
    		[
    			2,
    			-6
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-2,
    			6
    		],
    		[
    			0,
    			6
    		]
    	],
    	[
    		[
    			2603,
    			5197
    		],
    		[
    			0,
    			7
    		],
    		[
    			2,
    			2
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-1,
    			0
    		]
    	],
    	[
    		[
    			2607,
    			5209
    		],
    		[
    			2,
    			-6
    		],
    		[
    			0,
    			-9
    		],
    		[
    			0,
    			-11
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-1,
    			3
    		],
    		[
    			1,
    			7
    		],
    		[
    			0,
    			8
    		],
    		[
    			1,
    			6
    		],
    		[
    			0,
    			9
    		]
    	],
    	[
    		[
    			2572,
    			4460
    		],
    		[
    			3,
    			11
    		],
    		[
    			3,
    			14
    		],
    		[
    			1,
    			9
    		],
    		[
    			0,
    			11
    		],
    		[
    			2,
    			22
    		],
    		[
    			3,
    			15
    		],
    		[
    			1,
    			11
    		],
    		[
    			2,
    			19
    		],
    		[
    			1,
    			23
    		],
    		[
    			1,
    			22
    		],
    		[
    			0,
    			8
    		],
    		[
    			0,
    			15
    		],
    		[
    			0,
    			26
    		],
    		[
    			0,
    			24
    		],
    		[
    			-1,
    			18
    		],
    		[
    			-2,
    			21
    		],
    		[
    			-2,
    			23
    		],
    		[
    			-1,
    			15
    		],
    		[
    			-1,
    			22
    		],
    		[
    			-2,
    			19
    		],
    		[
    			0,
    			11
    		],
    		[
    			2,
    			13
    		],
    		[
    			1,
    			13
    		],
    		[
    			0,
    			8
    		],
    		[
    			-1,
    			21
    		],
    		[
    			-1,
    			10
    		],
    		[
    			0,
    			6
    		],
    		[
    			2,
    			12
    		],
    		[
    			2,
    			16
    		],
    		[
    			0,
    			8
    		],
    		[
    			2,
    			18
    		],
    		[
    			1,
    			14
    		],
    		[
    			0,
    			12
    		],
    		[
    			1,
    			16
    		],
    		[
    			-1,
    			15
    		],
    		[
    			0,
    			7
    		],
    		[
    			0,
    			4
    		],
    		[
    			4,
    			4
    		],
    		[
    			1,
    			8
    		],
    		[
    			0,
    			25
    		],
    		[
    			1,
    			2
    		],
    		[
    			1,
    			-2
    		],
    		[
    			2,
    			12
    		],
    		[
    			2,
    			-6
    		],
    		[
    			1,
    			2
    		],
    		[
    			1,
    			6
    		],
    		[
    			1,
    			13
    		],
    		[
    			2,
    			8
    		],
    		[
    			1,
    			10
    		],
    		[
    			1,
    			8
    		],
    		[
    			2,
    			-2
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			1,
    			-16
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			1,
    			-6
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			0,
    			-9
    		],
    		[
    			0,
    			-8
    		],
    		[
    			0,
    			-12
    		],
    		[
    			1,
    			0
    		],
    		[
    			1,
    			8
    		],
    		[
    			1,
    			15
    		],
    		[
    			0,
    			16
    		],
    		[
    			2,
    			3
    		],
    		[
    			-1,
    			-23
    		],
    		[
    			-2,
    			-11
    		],
    		[
    			0,
    			-9
    		],
    		[
    			1,
    			-2
    		],
    		[
    			1,
    			10
    		],
    		[
    			1,
    			2
    		],
    		[
    			2,
    			22
    		],
    		[
    			0,
    			12
    		],
    		[
    			0,
    			9
    		],
    		[
    			1,
    			14
    		],
    		[
    			-1,
    			13
    		],
    		[
    			0,
    			9
    		],
    		[
    			0,
    			6
    		],
    		[
    			2,
    			8
    		],
    		[
    			1,
    			1
    		],
    		[
    			2,
    			8
    		],
    		[
    			2,
    			2
    		],
    		[
    			3,
    			-2
    		],
    		[
    			3,
    			6
    		],
    		[
    			0,
    			6
    		],
    		[
    			-3,
    			2
    		],
    		[
    			-2,
    			8
    		],
    		[
    			-1,
    			17
    		],
    		[
    			2,
    			11
    		],
    		[
    			1,
    			5
    		],
    		[
    			2,
    			11
    		],
    		[
    			0,
    			5
    		],
    		[
    			1,
    			2
    		],
    		[
    			3,
    			0
    		],
    		[
    			1,
    			7
    		],
    		[
    			6,
    			-16
    		],
    		[
    			3,
    			-9
    		],
    		[
    			1,
    			3
    		],
    		[
    			1,
    			-3
    		],
    		[
    			1,
    			2
    		],
    		[
    			4,
    			-5
    		],
    		[
    			2,
    			-12
    		],
    		[
    			1,
    			-13
    		],
    		[
    			1,
    			-2
    		],
    		[
    			1,
    			1
    		],
    		[
    			3,
    			-2
    		],
    		[
    			3,
    			-13
    		],
    		[
    			2,
    			-1
    		],
    		[
    			4,
    			-11
    		],
    		[
    			3,
    			1
    		],
    		[
    			2,
    			-13
    		],
    		[
    			1,
    			-4
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			1,
    			-16
    		],
    		[
    			2,
    			-6
    		],
    		[
    			1,
    			-20
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			0,
    			-15
    		],
    		[
    			2,
    			-9
    		],
    		[
    			2,
    			-5
    		],
    		[
    			0,
    			-9
    		],
    		[
    			0,
    			-16
    		],
    		[
    			1,
    			-6
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			0,
    			-9
    		],
    		[
    			0,
    			-12
    		],
    		[
    			-1,
    			-18
    		],
    		[
    			1,
    			-8
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			-3,
    			0
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-1,
    			-32
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			1,
    			-5
    		],
    		[
    			-3,
    			-1
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			0,
    			-23
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			1,
    			-15
    		],
    		[
    			2,
    			-5
    		],
    		[
    			2,
    			-2
    		],
    		[
    			3,
    			-8
    		],
    		[
    			2,
    			11
    		],
    		[
    			2,
    			13
    		],
    		[
    			1,
    			-1
    		],
    		[
    			2,
    			18
    		],
    		[
    			0,
    			4
    		],
    		[
    			2,
    			9
    		],
    		[
    			0,
    			6
    		],
    		[
    			2,
    			5
    		],
    		[
    			0,
    			7
    		],
    		[
    			2,
    			1
    		],
    		[
    			4,
    			6
    		],
    		[
    			1,
    			6
    		],
    		[
    			1,
    			4
    		],
    		[
    			2,
    			1
    		],
    		[
    			1,
    			-5
    		],
    		[
    			2,
    			-4
    		],
    		[
    			2,
    			-6
    		],
    		[
    			1,
    			-20
    		],
    		[
    			2,
    			-10
    		],
    		[
    			0,
    			-17
    		],
    		[
    			1,
    			-26
    		],
    		[
    			0,
    			-11
    		],
    		[
    			1,
    			-20
    		],
    		[
    			1,
    			-39
    		],
    		[
    			1,
    			-23
    		],
    		[
    			2,
    			-18
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-1,
    			-22
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-1,
    			-18
    		],
    		[
    			0,
    			-11
    		],
    		[
    			-2,
    			-11
    		],
    		[
    			-3,
    			2
    		],
    		[
    			0,
    			13
    		],
    		[
    			1,
    			0
    		],
    		[
    			1,
    			9
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-3,
    			-6
    		],
    		[
    			0,
    			-7
    		],
    		[
    			0,
    			-3
    		],
    		[
    			1,
    			-6
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			0,
    			-9
    		],
    		[
    			0,
    			-4
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-2,
    			-11
    		],
    		[
    			-3,
    			-4
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			0,
    			-12
    		],
    		[
    			0,
    			-9
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			0,
    			-11
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-2,
    			-15
    		],
    		[
    			1,
    			-9
    		],
    		[
    			-1,
    			-2
    		]
    	],
    	[
    		[
    			2666,
    			4455
    		],
    		[
    			-9,
    			-2
    		],
    		[
    			-16,
    			-3
    		],
    		[
    			-13,
    			-2
    		]
    	],
    	[
    		[
    			2472,
    			5360
    		],
    		[
    			2,
    			8
    		],
    		[
    			9,
    			12
    		],
    		[
    			3,
    			12
    		],
    		[
    			2,
    			11
    		],
    		[
    			1,
    			4
    		],
    		[
    			4,
    			3
    		],
    		[
    			1,
    			-3
    		],
    		[
    			3,
    			4
    		],
    		[
    			2,
    			0
    		],
    		[
    			2,
    			3
    		],
    		[
    			3,
    			9
    		],
    		[
    			2,
    			5
    		],
    		[
    			1,
    			10
    		],
    		[
    			4,
    			2
    		],
    		[
    			2,
    			5
    		],
    		[
    			1,
    			15
    		],
    		[
    			3,
    			7
    		],
    		[
    			1,
    			3
    		],
    		[
    			1,
    			6
    		],
    		[
    			2,
    			7
    		],
    		[
    			2,
    			4
    		],
    		[
    			2,
    			9
    		],
    		[
    			3,
    			15
    		],
    		[
    			3,
    			9
    		],
    		[
    			2,
    			2
    		],
    		[
    			1,
    			5
    		],
    		[
    			6,
    			4
    		],
    		[
    			5,
    			-1
    		],
    		[
    			2,
    			-7
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-3,
    			-1
    		],
    		[
    			1,
    			-9
    		],
    		[
    			-3,
    			-8
    		],
    		[
    			-3,
    			-15
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			-16
    		],
    		[
    			0,
    			-10
    		],
    		[
    			0,
    			-9
    		],
    		[
    			1,
    			0
    		],
    		[
    			2,
    			10
    		],
    		[
    			3,
    			17
    		],
    		[
    			3,
    			7
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			3,
    			3
    		],
    		[
    			3,
    			-3
    		],
    		[
    			2,
    			1
    		],
    		[
    			4,
    			-8
    		],
    		[
    			1,
    			-7
    		],
    		[
    			2,
    			-3
    		],
    		[
    			2,
    			-6
    		],
    		[
    			0,
    			-11
    		],
    		[
    			2,
    			-6
    		],
    		[
    			0,
    			-8
    		],
    		[
    			1,
    			-2
    		],
    		[
    			1,
    			-6
    		],
    		[
    			1,
    			-2
    		],
    		[
    			1,
    			-9
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			1,
    			-4
    		],
    		[
    			3,
    			-3
    		],
    		[
    			4,
    			2
    		],
    		[
    			3,
    			7
    		],
    		[
    			1,
    			-2
    		],
    		[
    			1,
    			-10
    		],
    		[
    			1,
    			-2
    		],
    		[
    			1,
    			-4
    		],
    		[
    			1,
    			0
    		],
    		[
    			1,
    			7
    		],
    		[
    			1,
    			0
    		],
    		[
    			2,
    			-4
    		],
    		[
    			0,
    			8
    		],
    		[
    			-1,
    			9
    		],
    		[
    			2,
    			3
    		],
    		[
    			0,
    			-5
    		],
    		[
    			0,
    			-9
    		],
    		[
    			2,
    			-4
    		],
    		[
    			2,
    			11
    		],
    		[
    			4,
    			10
    		],
    		[
    			6,
    			18
    		],
    		[
    			1,
    			-3
    		],
    		[
    			4,
    			4
    		],
    		[
    			2,
    			2
    		],
    		[
    			3,
    			-2
    		],
    		[
    			5,
    			-1
    		],
    		[
    			3,
    			1
    		],
    		[
    			7,
    			14
    		],
    		[
    			2,
    			2
    		],
    		[
    			3,
    			-1
    		],
    		[
    			3,
    			2
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			0,
    			-21
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			1,
    			-8
    		],
    		[
    			3,
    			-3
    		],
    		[
    			2,
    			1
    		],
    		[
    			1,
    			-5
    		],
    		[
    			4,
    			8
    		],
    		[
    			1,
    			0
    		],
    		[
    			2,
    			-13
    		],
    		[
    			3,
    			9
    		],
    		[
    			1,
    			7
    		],
    		[
    			2,
    			1
    		],
    		[
    			1,
    			-3
    		],
    		[
    			2,
    			2
    		],
    		[
    			0,
    			6
    		],
    		[
    			3,
    			-1
    		],
    		[
    			1,
    			-5
    		],
    		[
    			-1,
    			-16
    		],
    		[
    			0,
    			-19
    		],
    		[
    			0,
    			-15
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			0,
    			-6
    		],
    		[
    			1,
    			-3
    		],
    		[
    			1,
    			4
    		],
    		[
    			1,
    			0
    		],
    		[
    			1,
    			-6
    		],
    		[
    			2,
    			-3
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			2,
    			-11
    		],
    		[
    			1,
    			0
    		],
    		[
    			1,
    			-6
    		],
    		[
    			1,
    			-1
    		],
    		[
    			1,
    			6
    		],
    		[
    			1,
    			-6
    		],
    		[
    			1,
    			4
    		],
    		[
    			0,
    			6
    		],
    		[
    			-1,
    			5
    		],
    		[
    			3,
    			5
    		],
    		[
    			2,
    			0
    		],
    		[
    			1,
    			-2
    		],
    		[
    			2,
    			-15
    		],
    		[
    			1,
    			-3
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-3,
    			7
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-3,
    			7
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-4,
    			-2
    		],
    		[
    			0,
    			-2
    		],
    		[
    			-3,
    			0
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-4,
    			14
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			1,
    			-11
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			1,
    			-10
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-3,
    			7
    		],
    		[
    			0,
    			5
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-2,
    			14
    		],
    		[
    			-4,
    			8
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-4,
    			9
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-3,
    			-2
    		],
    		[
    			-2,
    			-11
    		],
    		[
    			-2,
    			-12
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-3,
    			4
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-3,
    			6
    		],
    		[
    			-5,
    			0
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			-2,
    			0
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			0,
    			2
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-1,
    			0
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			1,
    			-7
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-2,
    			6
    		],
    		[
    			0,
    			7
    		],
    		[
    			4,
    			24
    		],
    		[
    			1,
    			7
    		],
    		[
    			0,
    			7
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-4,
    			5
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-3,
    			-5
    		],
    		[
    			-1,
    			2
    		],
    		[
    			0,
    			9
    		],
    		[
    			-1,
    			10
    		],
    		[
    			0,
    			6
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			0,
    			-18
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-2,
    			-21
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			0,
    			-3
    		],
    		[
    			-2,
    			-11
    		],
    		[
    			-2,
    			-18
    		],
    		[
    			-2,
    			-15
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			1,
    			-5
    		]
    	],
    	[
    		[
    			2551,
    			5085
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-1,
    			6
    		],
    		[
    			1,
    			19
    		],
    		[
    			1,
    			11
    		],
    		[
    			0,
    			6
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-1,
    			3
    		],
    		[
    			0,
    			7
    		],
    		[
    			0,
    			5
    		],
    		[
    			1,
    			6
    		],
    		[
    			1,
    			6
    		],
    		[
    			0,
    			7
    		],
    		[
    			0,
    			14
    		],
    		[
    			-1,
    			7
    		],
    		[
    			1,
    			5
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-2,
    			9
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-2,
    			6
    		],
    		[
    			2,
    			7
    		],
    		[
    			-1,
    			12
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-5,
    			5
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-3,
    			7
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-3,
    			7
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-7,
    			19
    		],
    		[
    			-11,
    			14
    		],
    		[
    			-18,
    			23
    		],
    		[
    			0,
    			4
    		],
    		[
    			-1,
    			15
    		],
    		[
    			-2,
    			12
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-2,
    			10
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-1,
    			6
    		]
    	],
    	[
    		[
    			2304,
    			4786
    		],
    		[
    			0,
    			89
    		],
    		[
    			0,
    			91
    		],
    		[
    			0,
    			94
    		],
    		[
    			0,
    			62
    		],
    		[
    			-1,
    			12
    		],
    		[
    			-4,
    			9
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-1,
    			12
    		],
    		[
    			-3,
    			16
    		],
    		[
    			1,
    			7
    		],
    		[
    			2,
    			10
    		],
    		[
    			3,
    			9
    		],
    		[
    			1,
    			8
    		],
    		[
    			1,
    			7
    		],
    		[
    			1,
    			21
    		]
    	],
    	[
    		[
    			2301,
    			5242
    		],
    		[
    			-1,
    			17
    		],
    		[
    			1,
    			11
    		],
    		[
    			-1,
    			25
    		],
    		[
    			0,
    			21
    		],
    		[
    			-2,
    			8
    		],
    		[
    			-2,
    			12
    		],
    		[
    			0,
    			7
    		],
    		[
    			-1,
    			20
    		],
    		[
    			-1,
    			9
    		],
    		[
    			0,
    			6
    		],
    		[
    			1,
    			12
    		],
    		[
    			-1,
    			17
    		],
    		[
    			1,
    			3
    		],
    		[
    			0,
    			11
    		],
    		[
    			-1,
    			13
    		],
    		[
    			0,
    			1
    		],
    		[
    			0,
    			26
    		],
    		[
    			-1,
    			17
    		],
    		[
    			0,
    			18
    		],
    		[
    			0,
    			17
    		],
    		[
    			-1,
    			7
    		],
    		[
    			1,
    			16
    		],
    		[
    			0,
    			15
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-1,
    			13
    		],
    		[
    			-1,
    			15
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-1,
    			21
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-1,
    			20
    		],
    		[
    			0,
    			3
    		],
    		[
    			-2,
    			19
    		],
    		[
    			1,
    			12
    		],
    		[
    			0,
    			9
    		],
    		[
    			-1,
    			15
    		],
    		[
    			1,
    			18
    		],
    		[
    			-1,
    			16
    		],
    		[
    			2,
    			27
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-1,
    			24
    		],
    		[
    			-1,
    			10
    		],
    		[
    			-1,
    			11
    		],
    		[
    			0,
    			6
    		]
    	],
    	[
    		[
    			2282,
    			5815
    		],
    		[
    			8,
    			0
    		],
    		[
    			15,
    			0
    		],
    		[
    			12,
    			0
    		],
    		[
    			17,
    			0
    		],
    		[
    			6,
    			0
    		],
    		[
    			0,
    			72
    		],
    		[
    			3,
    			-6
    		],
    		[
    			2,
    			4
    		],
    		[
    			3,
    			-9
    		],
    		[
    			1,
    			-6
    		],
    		[
    			2,
    			-32
    		],
    		[
    			0,
    			-4
    		],
    		[
    			0,
    			-19
    		],
    		[
    			1,
    			0
    		],
    		[
    			1,
    			-21
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			1,
    			-8
    		],
    		[
    			3,
    			-11
    		],
    		[
    			1,
    			-3
    		],
    		[
    			3,
    			-2
    		],
    		[
    			0,
    			3
    		],
    		[
    			5,
    			-2
    		],
    		[
    			0,
    			-9
    		],
    		[
    			3,
    			-1
    		],
    		[
    			4,
    			0
    		],
    		[
    			2,
    			-3
    		],
    		[
    			2,
    			0
    		],
    		[
    			2,
    			-11
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			1,
    			-2
    		],
    		[
    			4,
    			0
    		],
    		[
    			0,
    			3
    		],
    		[
    			3,
    			-1
    		],
    		[
    			2,
    			3
    		],
    		[
    			0,
    			9
    		],
    		[
    			3,
    			4
    		],
    		[
    			0,
    			2
    		],
    		[
    			3,
    			4
    		],
    		[
    			1,
    			-1
    		],
    		[
    			1,
    			-3
    		],
    		[
    			5,
    			0
    		],
    		[
    			8,
    			-16
    		],
    		[
    			2,
    			1
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			0,
    			-6
    		],
    		[
    			2,
    			-5
    		],
    		[
    			4,
    			2
    		],
    		[
    			1,
    			-9
    		],
    		[
    			0,
    			-9
    		],
    		[
    			1,
    			-11
    		],
    		[
    			2,
    			-14
    		],
    		[
    			2,
    			5
    		],
    		[
    			-1,
    			8
    		],
    		[
    			1,
    			10
    		],
    		[
    			0,
    			3
    		],
    		[
    			2,
    			-2
    		],
    		[
    			1,
    			3
    		],
    		[
    			2,
    			-2
    		],
    		[
    			3,
    			-6
    		],
    		[
    			0,
    			-10
    		],
    		[
    			3,
    			-5
    		],
    		[
    			1,
    			-6
    		],
    		[
    			4,
    			-2
    		],
    		[
    			0,
    			-10
    		],
    		[
    			0,
    			-5
    		],
    		[
    			2,
    			-4
    		],
    		[
    			2,
    			0
    		],
    		[
    			0,
    			-10
    		],
    		[
    			2,
    			5
    		],
    		[
    			2,
    			-4
    		],
    		[
    			1,
    			4
    		],
    		[
    			4,
    			3
    		],
    		[
    			3,
    			12
    		],
    		[
    			4,
    			13
    		],
    		[
    			3,
    			5
    		],
    		[
    			1,
    			-1
    		],
    		[
    			0,
    			-12
    		],
    		[
    			2,
    			-14
    		],
    		[
    			4,
    			1
    		],
    		[
    			1,
    			3
    		],
    		[
    			1,
    			-5
    		],
    		[
    			3,
    			1
    		],
    		[
    			2,
    			-2
    		],
    		[
    			2,
    			3
    		],
    		[
    			5,
    			1
    		],
    		[
    			3,
    			-5
    		],
    		[
    			1,
    			-13
    		],
    		[
    			3,
    			-5
    		],
    		[
    			2,
    			5
    		],
    		[
    			1,
    			2
    		],
    		[
    			2,
    			-3
    		],
    		[
    			2,
    			0
    		],
    		[
    			1,
    			-3
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-3,
    			-5
    		],
    		[
    			-3,
    			-9
    		],
    		[
    			-3,
    			-6
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-4,
    			-6
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-3,
    			-5
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-6,
    			-15
    		],
    		[
    			-4,
    			-13
    		],
    		[
    			-4,
    			-17
    		],
    		[
    			-4,
    			-18
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-4,
    			-25
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-3,
    			-14
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-3,
    			-13
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-7,
    			-26
    		],
    		[
    			1,
    			-8
    		],
    		[
    			1,
    			-7
    		]
    	],
    	[
    		[
    			2427,
    			5386
    		],
    		[
    			-2,
    			8
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-2,
    			-16
    		],
    		[
    			-2,
    			3
    		],
    		[
    			0,
    			-111
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-2,
    			-24
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			-1,
    			-15
    		],
    		[
    			0,
    			-12
    		],
    		[
    			2,
    			-2
    		],
    		[
    			1,
    			1
    		],
    		[
    			2,
    			-5
    		],
    		[
    			0,
    			-5
    		],
    		[
    			2,
    			-14
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			0,
    			-3
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			0,
    			-13
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			1,
    			-14
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			0,
    			-6
    		],
    		[
    			0,
    			-4
    		],
    		[
    			0,
    			-11
    		],
    		[
    			1,
    			-6
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-1,
    			-17
    		],
    		[
    			2,
    			-6
    		],
    		[
    			3,
    			-15
    		],
    		[
    			0,
    			-4
    		],
    		[
    			2,
    			-3
    		],
    		[
    			1,
    			-6
    		],
    		[
    			5,
    			-2
    		],
    		[
    			1,
    			-4
    		],
    		[
    			1,
    			-12
    		],
    		[
    			2,
    			-6
    		],
    		[
    			4,
    			-7
    		],
    		[
    			3,
    			-8
    		],
    		[
    			1,
    			-5
    		],
    		[
    			0,
    			-9
    		],
    		[
    			1,
    			-2
    		],
    		[
    			0,
    			-14
    		],
    		[
    			2,
    			-7
    		],
    		[
    			3,
    			-8
    		],
    		[
    			2,
    			-11
    		],
    		[
    			1,
    			-6
    		],
    		[
    			3,
    			-2
    		],
    		[
    			1,
    			-3
    		],
    		[
    			2,
    			-13
    		],
    		[
    			3,
    			-16
    		],
    		[
    			1,
    			-14
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			0,
    			-17
    		],
    		[
    			1,
    			-7
    		],
    		[
    			0,
    			-6
    		],
    		[
    			1,
    			-9
    		]
    	],
    	[
    		[
    			2475,
    			3194
    		],
    		[
    			11,
    			0
    		],
    		[
    			13,
    			0
    		],
    		[
    			17,
    			0
    		],
    		[
    			18,
    			0
    		]
    	],
    	[
    		[
    			2528,
    			2328
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			0,
    			-3
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			0,
    			4
    		],
    		[
    			-2,
    			1
    		],
    		[
    			0,
    			2
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-2,
    			12
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-3,
    			-2
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-5,
    			-12
    		],
    		[
    			0,
    			9
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			0,
    			-6
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			-1,
    			-13
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			-2
    		]
    	],
    	[
    		[
    			2355,
    			3476
    		],
    		[
    			0,
    			93
    		]
    	],
    	[
    		[
    			2336,
    			4131
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			4
    		],
    		[
    			1,
    			13
    		],
    		[
    			-2,
    			10
    		],
    		[
    			0,
    			9
    		],
    		[
    			-2,
    			8
    		],
    		[
    			0,
    			3
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-1,
    			19
    		],
    		[
    			0,
    			5
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			11
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			0,
    			11
    		]
    	],
    	[
    		[
    			2500,
    			3476
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			2
    		],
    		[
    			0,
    			4
    		]
    	],
    	[
    		[
    			2496,
    			3475
    		],
    		[
    			1,
    			-3
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			1,
    			-9
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-3,
    			0
    		],
    		[
    			0,
    			-6
    		],
    		[
    			2,
    			-7
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-3,
    			3
    		],
    		[
    			0,
    			-6
    		],
    		[
    			2,
    			-10
    		],
    		[
    			1,
    			-8
    		],
    		[
    			-3,
    			-8
    		],
    		[
    			0,
    			-9
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-1,
    			0
    		]
    	],
    	[
    		[
    			1758,
    			5816
    		],
    		[
    			23,
    			-1
    		],
    		[
    			23,
    			1
    		],
    		[
    			9,
    			-1
    		],
    		[
    			10,
    			0
    		],
    		[
    			19,
    			0
    		],
    		[
    			23,
    			0
    		],
    		[
    			20,
    			0
    		],
    		[
    			13,
    			0
    		],
    		[
    			24,
    			0
    		],
    		[
    			18,
    			0
    		],
    		[
    			14,
    			0
    		],
    		[
    			21,
    			0
    		],
    		[
    			23,
    			0
    		],
    		[
    			26,
    			0
    		],
    		[
    			12,
    			0
    		],
    		[
    			20,
    			0
    		],
    		[
    			13,
    			0
    		],
    		[
    			23,
    			0
    		]
    	],
    	[
    		[
    			2092,
    			5815
    		],
    		[
    			0,
    			-75
    		],
    		[
    			0,
    			-117
    		],
    		[
    			0,
    			-42
    		],
    		[
    			0,
    			-76
    		],
    		[
    			0,
    			-96
    		],
    		[
    			0,
    			-60
    		],
    		[
    			0,
    			-105
    		]
    	],
    	[
    		[
    			2092,
    			5244
    		],
    		[
    			0,
    			-37
    		],
    		[
    			0,
    			-70
    		],
    		[
    			0,
    			-70
    		],
    		[
    			0,
    			-1
    		]
    	],
    	[
    		[
    			2092,
    			5066
    		],
    		[
    			-12,
    			0
    		],
    		[
    			-17,
    			1
    		],
    		[
    			-21,
    			0
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-10,
    			0
    		],
    		[
    			-22,
    			0
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-17,
    			0
    		],
    		[
    			-14,
    			0
    		],
    		[
    			-23,
    			0
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-18,
    			-1
    		],
    		[
    			-10,
    			0
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-5,
    			1
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-8,
    			-1
    		],
    		[
    			-3,
    			2
    		],
    		[
    			-7,
    			0
    		],
    		[
    			0,
    			-71
    		],
    		[
    			0,
    			-28
    		]
    	],
    	[
    		[
    			2092,
    			4318
    		],
    		[
    			0,
    			78
    		],
    		[
    			0,
    			88
    		],
    		[
    			0,
    			45
    		],
    		[
    			0,
    			70
    		],
    		[
    			0,
    			93
    		]
    	],
    	[
    		[
    			2092,
    			4692
    		],
    		[
    			12,
    			0
    		],
    		[
    			14,
    			1
    		],
    		[
    			18,
    			-1
    		],
    		[
    			17,
    			0
    		],
    		[
    			7,
    			0
    		],
    		[
    			17,
    			0
    		],
    		[
    			10,
    			0
    		],
    		[
    			20,
    			0
    		],
    		[
    			13,
    			0
    		],
    		[
    			16,
    			0
    		],
    		[
    			11,
    			0
    		],
    		[
    			1,
    			-9
    		],
    		[
    			3,
    			-9
    		],
    		[
    			1,
    			-3
    		],
    		[
    			1,
    			-2
    		],
    		[
    			4,
    			-10
    		],
    		[
    			3,
    			-11
    		],
    		[
    			2,
    			1
    		],
    		[
    			2,
    			9
    		],
    		[
    			0,
    			8
    		],
    		[
    			1,
    			2
    		],
    		[
    			2,
    			-4
    		],
    		[
    			2,
    			-1
    		],
    		[
    			3,
    			3
    		],
    		[
    			1,
    			-2
    		],
    		[
    			1,
    			2
    		],
    		[
    			2,
    			-2
    		],
    		[
    			1,
    			3
    		],
    		[
    			1,
    			-2
    		],
    		[
    			2,
    			3
    		],
    		[
    			2,
    			-4
    		],
    		[
    			1,
    			-7
    		],
    		[
    			1,
    			-3
    		],
    		[
    			1,
    			-4
    		],
    		[
    			1,
    			0
    		],
    		[
    			3,
    			-2
    		],
    		[
    			1,
    			-8
    		],
    		[
    			1,
    			3
    		],
    		[
    			3,
    			-6
    		],
    		[
    			0,
    			-6
    		],
    		[
    			2,
    			-1
    		],
    		[
    			1,
    			-3
    		],
    		[
    			0,
    			-8
    		],
    		[
    			0,
    			-6
    		],
    		[
    			2,
    			-4
    		],
    		[
    			0,
    			-8
    		],
    		[
    			2,
    			2
    		],
    		[
    			1,
    			-7
    		],
    		[
    			2,
    			1
    		]
    	],
    	[
    		[
    			1648,
    			4504
    		],
    		[
    			6,
    			1
    		],
    		[
    			16,
    			-1
    		],
    		[
    			14,
    			0
    		],
    		[
    			14,
    			1
    		],
    		[
    			16,
    			0
    		],
    		[
    			17,
    			0
    		]
    	],
    	[
    		[
    			1814,
    			4504
    		],
    		[
    			0,
    			-20
    		],
    		[
    			0,
    			-74
    		],
    		[
    			0,
    			-53
    		],
    		[
    			0,
    			-82
    		],
    		[
    			0,
    			-70
    		],
    		[
    			0,
    			-75
    		],
    		[
    			0,
    			-93
    		],
    		[
    			0,
    			-92
    		],
    		[
    			-1,
    			-95
    		],
    		[
    			1,
    			-44
    		],
    		[
    			0,
    			-82
    		],
    		[
    			-1,
    			-44
    		],
    		[
    			0,
    			-111
    		]
    	],
    	[
    		[
    			2999,
    			5069
    		],
    		[
    			0,
    			11
    		],
    		[
    			2,
    			11
    		],
    		[
    			0,
    			2
    		],
    		[
    			1,
    			14
    		],
    		[
    			1,
    			11
    		],
    		[
    			2,
    			5
    		],
    		[
    			1,
    			-10
    		],
    		[
    			3,
    			-1
    		],
    		[
    			1,
    			12
    		]
    	],
    	[
    		[
    			3021,
    			4706
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-2,
    			-10
    		],
    		[
    			-1,
    			-15
    		],
    		[
    			0,
    			-7
    		]
    	],
    	[
    		[
    			2972,
    			4641
    		],
    		[
    			0,
    			6
    		],
    		[
    			-2,
    			10
    		],
    		[
    			0,
    			14
    		],
    		[
    			0,
    			6
    		],
    		[
    			0,
    			6
    		],
    		[
    			2,
    			4
    		],
    		[
    			1,
    			7
    		],
    		[
    			-1,
    			8
    		],
    		[
    			1,
    			7
    		],
    		[
    			0,
    			6
    		],
    		[
    			-1,
    			5
    		],
    		[
    			1,
    			10
    		],
    		[
    			0,
    			11
    		],
    		[
    			1,
    			10
    		],
    		[
    			-1,
    			9
    		],
    		[
    			1,
    			25
    		],
    		[
    			0,
    			3
    		],
    		[
    			1,
    			13
    		],
    		[
    			1,
    			4
    		],
    		[
    			0,
    			12
    		],
    		[
    			1,
    			7
    		],
    		[
    			0,
    			6
    		],
    		[
    			1,
    			2
    		],
    		[
    			2,
    			11
    		],
    		[
    			0,
    			10
    		],
    		[
    			1,
    			8
    		],
    		[
    			1,
    			3
    		],
    		[
    			0,
    			14
    		],
    		[
    			1,
    			10
    		],
    		[
    			1,
    			6
    		],
    		[
    			0,
    			4
    		],
    		[
    			0,
    			11
    		],
    		[
    			-1,
    			6
    		],
    		[
    			1,
    			9
    		],
    		[
    			-1,
    			6
    		],
    		[
    			1,
    			9
    		],
    		[
    			1,
    			4
    		],
    		[
    			3,
    			2
    		],
    		[
    			1,
    			-2
    		],
    		[
    			1,
    			4
    		],
    		[
    			1,
    			7
    		],
    		[
    			2,
    			3
    		],
    		[
    			1,
    			5
    		],
    		[
    			1,
    			6
    		],
    		[
    			1,
    			3
    		],
    		[
    			1,
    			14
    		],
    		[
    			0,
    			16
    		],
    		[
    			-2,
    			18
    		],
    		[
    			2,
    			9
    		],
    		[
    			0,
    			10
    		],
    		[
    			2,
    			12
    		],
    		[
    			-1,
    			16
    		],
    		[
    			1,
    			3
    		]
    	],
    	[
    		[
    			2910,
    			4385
    		],
    		[
    			6,
    			-21
    		],
    		[
    			5,
    			-14
    		],
    		[
    			11,
    			-32
    		],
    		[
    			0,
    			-3
    		],
    		[
    			-1,
    			-18
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			-1,
    			-14
    		],
    		[
    			0,
    			-8
    		]
    	],
    	[
    		[
    			2929,
    			4264
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			0,
    			-5
    		]
    	],
    	[
    		[
    			2927,
    			4252
    		],
    		[
    			-3,
    			0
    		],
    		[
    			0,
    			-3
    		]
    	],
    	[
    		[
    			2924,
    			4249
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			0,
    			-10
    		],
    		[
    			0,
    			-4
    		],
    		[
    			2,
    			-5
    		],
    		[
    			2,
    			3
    		],
    		[
    			2,
    			-7
    		],
    		[
    			1,
    			-1
    		],
    		[
    			1,
    			-8
    		],
    		[
    			0,
    			-13
    		],
    		[
    			-2,
    			-33
    		],
    		[
    			-1,
    			-40
    		],
    		[
    			0,
    			-27
    		],
    		[
    			-2,
    			-14
    		],
    		[
    			-2,
    			-25
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-3,
    			-21
    		],
    		[
    			-3,
    			-9
    		],
    		[
    			-3,
    			-13
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-2,
    			-17
    		],
    		[
    			1,
    			-3
    		],
    		[
    			-2,
    			-15
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-1,
    			3
    		],
    		[
    			1,
    			11
    		],
    		[
    			1,
    			16
    		],
    		[
    			1,
    			13
    		],
    		[
    			-3,
    			6
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-3,
    			9
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-2,
    			4
    		],
    		[
    			1,
    			14
    		],
    		[
    			0,
    			8
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			5
    		],
    		[
    			1,
    			10
    		]
    	],
    	[
    		[
    			2890,
    			4094
    		],
    		[
    			2,
    			9
    		],
    		[
    			2,
    			0
    		],
    		[
    			3,
    			6
    		],
    		[
    			1,
    			3
    		],
    		[
    			0,
    			11
    		],
    		[
    			1,
    			4
    		],
    		[
    			1,
    			6
    		],
    		[
    			1,
    			2
    		],
    		[
    			2,
    			9
    		],
    		[
    			2,
    			2
    		],
    		[
    			2,
    			9
    		],
    		[
    			0,
    			-2
    		],
    		[
    			2,
    			5
    		],
    		[
    			-1,
    			13
    		],
    		[
    			-2,
    			7
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-2,
    			8
    		],
    		[
    			-1,
    			11
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			7
    		],
    		[
    			0,
    			16
    		],
    		[
    			0,
    			5
    		],
    		[
    			-3,
    			2
    		],
    		[
    			0,
    			13
    		],
    		[
    			0,
    			6
    		],
    		[
    			0,
    			2
    		],
    		[
    			0,
    			7
    		],
    		[
    			0,
    			5
    		],
    		[
    			1,
    			4
    		],
    		[
    			1,
    			3
    		],
    		[
    			2,
    			15
    		],
    		[
    			-2,
    			15
    		],
    		[
    			0,
    			7
    		],
    		[
    			3,
    			9
    		],
    		[
    			1,
    			13
    		],
    		[
    			2,
    			6
    		],
    		[
    			1,
    			8
    		],
    		[
    			1,
    			18
    		],
    		[
    			2,
    			13
    		],
    		[
    			2,
    			2
    		]
    	],
    	[
    		[
    			2023,
    			2593
    		],
    		[
    			-13,
    			0
    		],
    		[
    			-12,
    			0
    		],
    		[
    			-22,
    			0
    		],
    		[
    			0,
    			-84
    		],
    		[
    			-14,
    			0
    		],
    		[
    			-9,
    			0
    		]
    	],
    	[
    		[
    			2121,
    			3569
    		],
    		[
    			0,
    			-93
    		]
    	],
    	[
    		[
    			2121,
    			3476
    		],
    		[
    			-1,
    			0
    		],
    		[
    			0,
    			-83
    		],
    		[
    			0,
    			-81
    		],
    		[
    			0,
    			-70
    		],
    		[
    			0,
    			-75
    		],
    		[
    			0,
    			-73
    		],
    		[
    			0,
    			-85
    		],
    		[
    			0,
    			-116
    		],
    		[
    			0,
    			-72
    		],
    		[
    			0,
    			-90
    		],
    		[
    			0,
    			-97
    		],
    		[
    			-19,
    			0
    		],
    		[
    			-8,
    			0
    		],
    		[
    			-14,
    			0
    		],
    		[
    			-11,
    			0
    		],
    		[
    			-14,
    			0
    		],
    		[
    			-20,
    			0
    		],
    		[
    			-13,
    			0
    		],
    		[
    			-1,
    			-14
    		],
    		[
    			0,
    			-6
    		],
    		[
    			0,
    			-5
    		],
    		[
    			2,
    			-11
    		],
    		[
    			1,
    			-5
    		]
    	],
    	[
    		[
    			2924,
    			4249
    		],
    		[
    			3,
    			3
    		]
    	],
    	[
    		[
    			2927,
    			4252
    		],
    		[
    			1,
    			-8
    		],
    		[
    			-2,
    			-11
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-3,
    			-7
    		],
    		[
    			0,
    			9
    		],
    		[
    			1,
    			3
    		],
    		[
    			1,
    			13
    		]
    	],
    	[
    		[
    			2987,
    			4372
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-1,
    			4
    		],
    		[
    			3,
    			3
    		]
    	],
    	[
    		[
    			2948,
    			5069
    		],
    		[
    			0,
    			-17
    		],
    		[
    			-2,
    			-14
    		],
    		[
    			2,
    			-8
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-1,
    			-16
    		],
    		[
    			0,
    			-5
    		],
    		[
    			2,
    			-7
    		],
    		[
    			1,
    			-14
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			0,
    			-18
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-2,
    			-10
    		],
    		[
    			-1,
    			-27
    		],
    		[
    			1,
    			-3
    		],
    		[
    			0,
    			-18
    		],
    		[
    			1,
    			-11
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			1,
    			-9
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			0,
    			-9
    		],
    		[
    			1,
    			-1
    		],
    		[
    			1,
    			8
    		],
    		[
    			2,
    			0
    		],
    		[
    			0,
    			-8
    		],
    		[
    			1,
    			-3
    		],
    		[
    			0,
    			-7
    		],
    		[
    			0,
    			-50
    		],
    		[
    			0,
    			-42
    		],
    		[
    			-1,
    			-38
    		],
    		[
    			0,
    			-6
    		],
    		[
    			1,
    			-10
    		]
    	],
    	[
    		[
    			2939,
    			4315
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			1,
    			-7
    		],
    		[
    			2,
    			14
    		],
    		[
    			1,
    			-3
    		],
    		[
    			1,
    			8
    		],
    		[
    			2,
    			3
    		],
    		[
    			2,
    			1
    		],
    		[
    			0,
    			4
    		],
    		[
    			2,
    			-1
    		],
    		[
    			1,
    			3
    		],
    		[
    			1,
    			-5
    		],
    		[
    			2,
    			0
    		],
    		[
    			2,
    			-4
    		],
    		[
    			2,
    			5
    		],
    		[
    			0,
    			7
    		],
    		[
    			2,
    			1
    		],
    		[
    			1,
    			-2
    		],
    		[
    			7,
    			1
    		],
    		[
    			3,
    			4
    		],
    		[
    			3,
    			2
    		],
    		[
    			1,
    			7
    		],
    		[
    			2,
    			3
    		],
    		[
    			1,
    			6
    		],
    		[
    			1,
    			2
    		],
    		[
    			1,
    			7
    		],
    		[
    			3,
    			-17
    		],
    		[
    			2,
    			-2
    		],
    		[
    			0,
    			4
    		],
    		[
    			2,
    			-12
    		],
    		[
    			3,
    			9
    		],
    		[
    			1,
    			6
    		],
    		[
    			1,
    			2
    		],
    		[
    			1,
    			-5
    		],
    		[
    			-6,
    			-15
    		],
    		[
    			-8,
    			-20
    		],
    		[
    			-5,
    			-10
    		],
    		[
    			-5,
    			-10
    		],
    		[
    			-5,
    			-9
    		],
    		[
    			-3,
    			-8
    		],
    		[
    			-5,
    			-7
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-3,
    			-6
    		],
    		[
    			-4,
    			-4
    		],
    		[
    			-5,
    			0
    		],
    		[
    			0,
    			1
    		],
    		[
    			-5,
    			-8
    		],
    		[
    			0,
    			5
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-1,
    			7
    		],
    		[
    			1,
    			6
    		],
    		[
    			0,
    			10
    		]
    	],
    	[
    		[
    			2910,
    			4385
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-4,
    			3
    		],
    		[
    			0,
    			6
    		],
    		[
    			-2,
    			2
    		],
    		[
    			0,
    			5
    		],
    		[
    			-3,
    			18
    		],
    		[
    			1,
    			3
    		],
    		[
    			0,
    			25
    		],
    		[
    			-2,
    			4
    		],
    		[
    			1,
    			7
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-2,
    			0
    		],
    		[
    			0,
    			13
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-2,
    			9
    		],
    		[
    			-10,
    			0
    		],
    		[
    			-17,
    			0
    		],
    		[
    			-11,
    			1
    		],
    		[
    			-11,
    			-1
    		],
    		[
    			-20,
    			0
    		],
    		[
    			-12,
    			0
    		],
    		[
    			-9,
    			0
    		],
    		[
    			-8,
    			0
    		],
    		[
    			-8,
    			0
    		],
    		[
    			-8,
    			0
    		],
    		[
    			-8,
    			0
    		],
    		[
    			0,
    			51
    		]
    	],
    	[
    		[
    			2769,
    			4556
    		],
    		[
    			3,
    			8
    		],
    		[
    			3,
    			9
    		],
    		[
    			3,
    			12
    		],
    		[
    			2,
    			12
    		],
    		[
    			3,
    			8
    		],
    		[
    			3,
    			4
    		],
    		[
    			1,
    			11
    		],
    		[
    			1,
    			6
    		],
    		[
    			1,
    			8
    		],
    		[
    			3,
    			9
    		],
    		[
    			2,
    			9
    		],
    		[
    			0,
    			11
    		],
    		[
    			-1,
    			11
    		],
    		[
    			-1,
    			10
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-1,
    			5
    		],
    		[
    			1,
    			9
    		],
    		[
    			-2,
    			3
    		],
    		[
    			1,
    			12
    		],
    		[
    			-1,
    			18
    		],
    		[
    			0,
    			4
    		],
    		[
    			3,
    			4
    		],
    		[
    			4,
    			7
    		],
    		[
    			3,
    			4
    		],
    		[
    			2,
    			3
    		],
    		[
    			4,
    			4
    		],
    		[
    			3,
    			0
    		],
    		[
    			4,
    			-2
    		],
    		[
    			4,
    			2
    		],
    		[
    			3,
    			-2
    		],
    		[
    			3,
    			-3
    		],
    		[
    			4,
    			-2
    		],
    		[
    			1,
    			-3
    		],
    		[
    			1,
    			-8
    		],
    		[
    			3,
    			-7
    		],
    		[
    			1,
    			-2
    		],
    		[
    			1,
    			3
    		],
    		[
    			3,
    			5
    		],
    		[
    			3,
    			0
    		],
    		[
    			5,
    			2
    		],
    		[
    			2,
    			-3
    		],
    		[
    			2,
    			0
    		],
    		[
    			1,
    			4
    		],
    		[
    			4,
    			5
    		],
    		[
    			2,
    			5
    		],
    		[
    			2,
    			13
    		],
    		[
    			6,
    			20
    		],
    		[
    			3,
    			-2
    		],
    		[
    			2,
    			3
    		],
    		[
    			1,
    			9
    		],
    		[
    			0,
    			14
    		],
    		[
    			0,
    			13
    		],
    		[
    			-1,
    			16
    		],
    		[
    			-1,
    			7
    		],
    		[
    			1,
    			7
    		],
    		[
    			1,
    			-3
    		],
    		[
    			2,
    			6
    		],
    		[
    			0,
    			11
    		],
    		[
    			-4,
    			8
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			7
    		],
    		[
    			-2,
    			2
    		],
    		[
    			0,
    			5
    		],
    		[
    			2,
    			19
    		],
    		[
    			2,
    			1
    		],
    		[
    			2,
    			6
    		],
    		[
    			0,
    			8
    		],
    		[
    			2,
    			4
    		],
    		[
    			3,
    			9
    		],
    		[
    			0,
    			-1
    		],
    		[
    			2,
    			4
    		],
    		[
    			3,
    			12
    		],
    		[
    			0,
    			8
    		],
    		[
    			1,
    			8
    		],
    		[
    			4,
    			20
    		],
    		[
    			3,
    			15
    		],
    		[
    			4,
    			15
    		],
    		[
    			4,
    			16
    		],
    		[
    			5,
    			12
    		],
    		[
    			2,
    			10
    		],
    		[
    			2,
    			0
    		],
    		[
    			2,
    			6
    		],
    		[
    			3,
    			-5
    		],
    		[
    			1,
    			2
    		],
    		[
    			6,
    			-1
    		],
    		[
    			4,
    			-1
    		],
    		[
    			5,
    			0
    		],
    		[
    			8,
    			2
    		],
    		[
    			6,
    			0
    		],
    		[
    			9,
    			2
    		]
    	],
    	[
    		[
    			2880,
    			3232
    		],
    		[
    			2,
    			6
    		],
    		[
    			2,
    			1
    		],
    		[
    			1,
    			5
    		],
    		[
    			1,
    			2
    		],
    		[
    			1,
    			-7
    		],
    		[
    			-3,
    			-1
    		],
    		[
    			-4,
    			-9
    		],
    		[
    			-5,
    			-14
    		],
    		[
    			0,
    			2
    		],
    		[
    			1,
    			6
    		],
    		[
    			4,
    			9
    		]
    	],
    	[
    		[
    			2883,
    			3369
    		],
    		[
    			0,
    			-4
    		],
    		[
    			1,
    			-10
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-1,
    			1
    		],
    		[
    			0,
    			7
    		],
    		[
    			-2,
    			12
    		],
    		[
    			2,
    			1
    		]
    	],
    	[
    		[
    			2877,
    			3485
    		],
    		[
    			2,
    			-36
    		],
    		[
    			1,
    			-24
    		],
    		[
    			1,
    			-22
    		],
    		[
    			2,
    			-17
    		],
    		[
    			3,
    			-29
    		],
    		[
    			-2,
    			5
    		],
    		[
    			0,
    			6
    		],
    		[
    			-2,
    			13
    		],
    		[
    			-1,
    			2
    		],
    		[
    			0,
    			7
    		],
    		[
    			-1,
    			21
    		],
    		[
    			0,
    			12
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			8
    		],
    		[
    			-1,
    			3
    		],
    		[
    			0,
    			7
    		],
    		[
    			0,
    			8
    		],
    		[
    			0,
    			6
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-3,
    			4
    		],
    		[
    			0,
    			-3
    		],
    		[
    			0,
    			-8
    		],
    		[
    			2,
    			-5
    		],
    		[
    			1,
    			2
    		],
    		[
    			0,
    			-11
    		],
    		[
    			2,
    			-31
    		],
    		[
    			0,
    			-5
    		],
    		[
    			1,
    			-12
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-2,
    			10
    		],
    		[
    			0,
    			6
    		],
    		[
    			-1,
    			10
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			1,
    			-10
    		],
    		[
    			1,
    			-2
    		],
    		[
    			1,
    			-12
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-3,
    			-1
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-2,
    			20
    		],
    		[
    			0,
    			10
    		],
    		[
    			2,
    			12
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			0,
    			-12
    		],
    		[
    			0,
    			-15
    		],
    		[
    			2,
    			-14
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			1,
    			-6
    		],
    		[
    			4,
    			2
    		],
    		[
    			2,
    			5
    		],
    		[
    			1,
    			2
    		],
    		[
    			1,
    			-8
    		],
    		[
    			2,
    			1
    		],
    		[
    			1,
    			5
    		],
    		[
    			3,
    			4
    		],
    		[
    			3,
    			0
    		],
    		[
    			1,
    			-7
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			0,
    			-9
    		],
    		[
    			0,
    			-17
    		],
    		[
    			1,
    			-9
    		],
    		[
    			1,
    			19
    		],
    		[
    			0,
    			13
    		],
    		[
    			0,
    			11
    		],
    		[
    			2,
    			8
    		],
    		[
    			0,
    			7
    		],
    		[
    			2,
    			0
    		],
    		[
    			2,
    			-8
    		],
    		[
    			1,
    			-23
    		],
    		[
    			0,
    			-8
    		],
    		[
    			1,
    			-14
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			0,
    			-3
    		],
    		[
    			-4,
    			2
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-3,
    			3
    		],
    		[
    			0,
    			4
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-2,
    			7
    		],
    		[
    			-1,
    			18
    		],
    		[
    			3,
    			1
    		],
    		[
    			0,
    			5
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			1,
    			-10
    		],
    		[
    			0,
    			-14
    		],
    		[
    			-3,
    			8
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-3,
    			5
    		],
    		[
    			-2,
    			7
    		],
    		[
    			0,
    			-4
    		],
    		[
    			2,
    			-10
    		],
    		[
    			2,
    			-1
    		],
    		[
    			6,
    			-16
    		],
    		[
    			5,
    			-5
    		],
    		[
    			0,
    			-5
    		],
    		[
    			0,
    			-6
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-5,
    			-17
    		],
    		[
    			-5,
    			18
    		],
    		[
    			0,
    			-10
    		],
    		[
    			3,
    			-9
    		],
    		[
    			3,
    			-7
    		],
    		[
    			4,
    			13
    		],
    		[
    			4,
    			3
    		],
    		[
    			0,
    			12
    		],
    		[
    			1,
    			-2
    		],
    		[
    			1,
    			-11
    		],
    		[
    			1,
    			-5
    		],
    		[
    			1,
    			0
    		],
    		[
    			0,
    			11
    		],
    		[
    			1,
    			-5
    		],
    		[
    			0,
    			-3
    		],
    		[
    			1,
    			-9
    		],
    		[
    			-2,
    			-13
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-1,
    			-13
    		],
    		[
    			-2,
    			-19
    		],
    		[
    			-2,
    			3
    		],
    		[
    			0,
    			13
    		],
    		[
    			-1,
    			3
    		],
    		[
    			0,
    			-13
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			4,
    			-10
    		],
    		[
    			4,
    			29
    		],
    		[
    			2,
    			10
    		],
    		[
    			2,
    			12
    		],
    		[
    			4,
    			23
    		],
    		[
    			1,
    			5
    		],
    		[
    			1,
    			-3
    		],
    		[
    			-3,
    			-13
    		],
    		[
    			-3,
    			-16
    		],
    		[
    			-2,
    			-10
    		],
    		[
    			-2,
    			-12
    		],
    		[
    			-3,
    			-23
    		],
    		[
    			-1,
    			-14
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			6
    		],
    		[
    			-3,
    			9
    		],
    		[
    			-3,
    			0
    		],
    		[
    			-4,
    			-2
    		],
    		[
    			-3,
    			-4
    		],
    		[
    			-3,
    			-6
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-3,
    			-13
    		],
    		[
    			-4,
    			-12
    		],
    		[
    			-4,
    			-13
    		],
    		[
    			-2,
    			-11
    		],
    		[
    			-2,
    			-13
    		],
    		[
    			-2,
    			-21
    		],
    		[
    			-2,
    			-17
    		],
    		[
    			-1,
    			-18
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			0,
    			-11
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-3,
    			-1
    		],
    		[
    			-3,
    			-1
    		],
    		[
    			-3,
    			-7
    		],
    		[
    			-1,
    			-3
    		]
    	],
    	[
    		[
    			2803,
    			2980
    		],
    		[
    			-10,
    			53
    		],
    		[
    			-10,
    			59
    		],
    		[
    			-3,
    			18
    		],
    		[
    			-9,
    			48
    		],
    		[
    			-5,
    			1
    		],
    		[
    			-18,
    			2
    		],
    		[
    			-8,
    			0
    		],
    		[
    			0,
    			22
    		],
    		[
    			-4,
    			32
    		],
    		[
    			-3,
    			-12
    		],
    		[
    			0,
    			8
    		],
    		[
    			0,
    			5
    		],
    		[
    			0,
    			7
    		],
    		[
    			-5,
    			2
    		],
    		[
    			-14,
    			4
    		],
    		[
    			-13,
    			2
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-3,
    			-2
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-4,
    			-13
    		],
    		[
    			0,
    			3
    		],
    		[
    			-10,
    			-16
    		]
    	],
    	[
    		[
    			2642,
    			3193
    		],
    		[
    			1,
    			44
    		],
    		[
    			1,
    			8
    		],
    		[
    			1,
    			-4
    		],
    		[
    			3,
    			0
    		],
    		[
    			1,
    			4
    		],
    		[
    			1,
    			6
    		],
    		[
    			0,
    			9
    		],
    		[
    			0,
    			5
    		],
    		[
    			0,
    			6
    		],
    		[
    			2,
    			11
    		],
    		[
    			1,
    			2
    		],
    		[
    			1,
    			8
    		],
    		[
    			2,
    			1
    		],
    		[
    			1,
    			7
    		],
    		[
    			4,
    			1
    		],
    		[
    			4,
    			-1
    		],
    		[
    			1,
    			10
    		],
    		[
    			2,
    			5
    		],
    		[
    			1,
    			5
    		],
    		[
    			1,
    			-2
    		],
    		[
    			1,
    			7
    		],
    		[
    			1,
    			6
    		],
    		[
    			1,
    			1
    		],
    		[
    			1,
    			6
    		],
    		[
    			1,
    			0
    		],
    		[
    			1,
    			5
    		],
    		[
    			3,
    			-3
    		],
    		[
    			2,
    			18
    		],
    		[
    			0,
    			8
    		],
    		[
    			0,
    			6
    		],
    		[
    			2,
    			1
    		],
    		[
    			0,
    			-4
    		],
    		[
    			1,
    			4
    		],
    		[
    			1,
    			7
    		],
    		[
    			2,
    			11
    		],
    		[
    			2,
    			3
    		],
    		[
    			1,
    			-6
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			0,
    			-6
    		],
    		[
    			2,
    			0
    		],
    		[
    			1,
    			2
    		],
    		[
    			2,
    			6
    		],
    		[
    			1,
    			14
    		],
    		[
    			1,
    			6
    		],
    		[
    			2,
    			4
    		],
    		[
    			1,
    			-1
    		],
    		[
    			2,
    			5
    		],
    		[
    			1,
    			-2
    		],
    		[
    			1,
    			-8
    		],
    		[
    			1,
    			0
    		],
    		[
    			1,
    			3
    		],
    		[
    			4,
    			34
    		],
    		[
    			1,
    			6
    		],
    		[
    			2,
    			4
    		],
    		[
    			1,
    			-3
    		],
    		[
    			1,
    			3
    		],
    		[
    			0,
    			10
    		],
    		[
    			1,
    			11
    		],
    		[
    			0,
    			13
    		],
    		[
    			0,
    			9
    		]
    	],
    	[
    		[
    			2715,
    			3492
    		],
    		[
    			9,
    			-2
    		],
    		[
    			2,
    			0
    		],
    		[
    			13,
    			-3
    		],
    		[
    			3,
    			0
    		],
    		[
    			12,
    			-3
    		],
    		[
    			11,
    			0
    		],
    		[
    			11,
    			-1
    		],
    		[
    			15,
    			1
    		],
    		[
    			13,
    			-1
    		],
    		[
    			21,
    			1
    		],
    		[
    			12,
    			0
    		],
    		[
    			11,
    			0
    		],
    		[
    			3,
    			1
    		],
    		[
    			14,
    			0
    		],
    		[
    			12,
    			0
    		]
    	],
    	[
    		[
    			2092,
    			5815
    		],
    		[
    			19,
    			0
    		],
    		[
    			15,
    			0
    		],
    		[
    			17,
    			0
    		],
    		[
    			17,
    			0
    		],
    		[
    			14,
    			0
    		],
    		[
    			19,
    			0
    		],
    		[
    			14,
    			0
    		],
    		[
    			15,
    			0
    		],
    		[
    			14,
    			0
    		],
    		[
    			26,
    			0
    		],
    		[
    			20,
    			0
    		]
    	],
    	[
    		[
    			2301,
    			5242
    		],
    		[
    			-17,
    			0
    		],
    		[
    			-17,
    			0
    		],
    		[
    			-18,
    			0
    		],
    		[
    			-23,
    			1
    		],
    		[
    			-14,
    			0
    		],
    		[
    			-12,
    			0
    		],
    		[
    			-21,
    			0
    		],
    		[
    			-14,
    			0
    		],
    		[
    			-21,
    			0
    		],
    		[
    			-20,
    			1
    		],
    		[
    			-21,
    			0
    		],
    		[
    			-11,
    			0
    		]
    	],
    	[
    		[
    			2683,
    			4451
    		],
    		[
    			2,
    			-3
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			0,
    			12
    		]
    	],
    	[
    		[
    			2666,
    			4455
    		],
    		[
    			0,
    			-5
    		],
    		[
    			3,
    			-3
    		],
    		[
    			0,
    			2
    		],
    		[
    			3,
    			-10
    		],
    		[
    			5,
    			-10
    		],
    		[
    			2,
    			-10
    		],
    		[
    			1,
    			-5
    		],
    		[
    			1,
    			1
    		],
    		[
    			2,
    			6
    		],
    		[
    			0,
    			7
    		],
    		[
    			1,
    			-9
    		],
    		[
    			2,
    			0
    		],
    		[
    			0,
    			-4
    		],
    		[
    			3,
    			-17
    		],
    		[
    			3,
    			-8
    		],
    		[
    			1,
    			-1
    		],
    		[
    			3,
    			9
    		],
    		[
    			3,
    			1
    		],
    		[
    			2,
    			6
    		],
    		[
    			5,
    			10
    		],
    		[
    			2,
    			-5
    		],
    		[
    			2,
    			-1
    		],
    		[
    			2,
    			2
    		],
    		[
    			1,
    			-2
    		],
    		[
    			5,
    			14
    		],
    		[
    			1,
    			10
    		],
    		[
    			1,
    			2
    		],
    		[
    			2,
    			9
    		],
    		[
    			2,
    			10
    		],
    		[
    			2,
    			6
    		],
    		[
    			1,
    			1
    		],
    		[
    			4,
    			10
    		],
    		[
    			3,
    			7
    		],
    		[
    			3,
    			3
    		],
    		[
    			3,
    			7
    		],
    		[
    			2,
    			2
    		],
    		[
    			6,
    			11
    		]
    	],
    	[
    		[
    			2748,
    			4501
    		],
    		[
    			0,
    			-58
    		],
    		[
    			0,
    			-78
    		],
    		[
    			0,
    			-115
    		]
    	],
    	[
    		[
    			2748,
    			4250
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			1,
    			-7
    		],
    		[
    			0,
    			-10
    		],
    		[
    			0,
    			-8
    		],
    		[
    			0,
    			-23
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			0,
    			-10
    		],
    		[
    			0,
    			-5
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-1,
    			-15
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			0,
    			-11
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			1,
    			-7
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			0,
    			-14
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-2,
    			-12
    		],
    		[
    			-3,
    			-12
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			-2,
    			2
    		],
    		[
    			0,
    			6
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-3,
    			-13
    		],
    		[
    			-1,
    			-13
    		],
    		[
    			-3,
    			1
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			1,
    			-11
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			0,
    			-4
    		],
    		[
    			1,
    			-8
    		],
    		[
    			-1,
    			-17
    		],
    		[
    			0,
    			4
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-1,
    			5
    		],
    		[
    			1,
    			7
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-1,
    			1
    		],
    		[
    			0,
    			6
    		],
    		[
    			-2,
    			0
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-2,
    			-14
    		],
    		[
    			0,
    			-11
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			1,
    			-16
    		],
    		[
    			0,
    			-5
    		],
    		[
    			1,
    			-10
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			0,
    			-16
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-3,
    			-7
    		],
    		[
    			-2,
    			3
    		]
    	],
    	[
    		[
    			2359,
    			2940
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-3,
    			7
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			0,
    			4
    		],
    		[
    			-2,
    			9
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-3,
    			9
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-2,
    			5
    		],
    		[
    			0,
    			6
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-3,
    			5
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-3,
    			-2
    		],
    		[
    			-4,
    			3
    		],
    		[
    			0,
    			9
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-1,
    			2
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-3,
    			10
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-3,
    			-5
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			0,
    			-13
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-2,
    			11
    		],
    		[
    			0,
    			6
    		],
    		[
    			-3,
    			-1
    		],
    		[
    			0,
    			9
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-1,
    			4
    		],
    		[
    			1,
    			6
    		],
    		[
    			-2,
    			7
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-1,
    			8
    		],
    		[
    			0,
    			7
    		],
    		[
    			0,
    			5
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			0,
    			-6
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-1,
    			12
    		],
    		[
    			0,
    			5
    		],
    		[
    			1,
    			3
    		],
    		[
    			-1,
    			9
    		],
    		[
    			0,
    			4
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			4
    		],
    		[
    			0,
    			12
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-1,
    			4
    		],
    		[
    			0,
    			6
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-2,
    			-10
    		],
    		[
    			-3,
    			-15
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-2,
    			5
    		],
    		[
    			0,
    			1
    		],
    		[
    			0,
    			13
    		],
    		[
    			0,
    			7
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-1,
    			16
    		],
    		[
    			1,
    			8
    		],
    		[
    			0,
    			5
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			0,
    			1
    		],
    		[
    			-2,
    			15
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-3,
    			4
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			13
    		],
    		[
    			0,
    			11
    		],
    		[
    			-2,
    			8
    		],
    		[
    			1,
    			3
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-2,
    			6
    		],
    		[
    			0,
    			-2
    		],
    		[
    			0,
    			-12
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-2,
    			7
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-3,
    			1
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-3,
    			17
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			0,
    			88
    		],
    		[
    			0,
    			110
    		],
    		[
    			0,
    			82
    		],
    		[
    			0,
    			83
    		],
    		[
    			-15,
    			0
    		],
    		[
    			-15,
    			0
    		],
    		[
    			-15,
    			0
    		],
    		[
    			-18,
    			0
    		],
    		[
    			-21,
    			0
    		]
    	],
    	[
    		[
    			1530,
    			4505
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-2,
    			12
    		],
    		[
    			0,
    			12
    		],
    		[
    			0,
    			7
    		],
    		[
    			-1,
    			6
    		],
    		[
    			0,
    			11
    		],
    		[
    			-1,
    			4
    		],
    		[
    			1,
    			9
    		],
    		[
    			-1,
    			12
    		],
    		[
    			1,
    			25
    		],
    		[
    			0,
    			16
    		],
    		[
    			-2,
    			13
    		],
    		[
    			-1,
    			1
    		],
    		[
    			0,
    			10
    		],
    		[
    			-1,
    			10
    		],
    		[
    			1,
    			14
    		],
    		[
    			2,
    			15
    		],
    		[
    			0,
    			14
    		],
    		[
    			0,
    			8
    		],
    		[
    			1,
    			13
    		],
    		[
    			1,
    			16
    		],
    		[
    			-1,
    			7
    		],
    		[
    			2,
    			8
    		],
    		[
    			1,
    			16
    		],
    		[
    			2,
    			23
    		],
    		[
    			2,
    			47
    		],
    		[
    			0,
    			28
    		],
    		[
    			1,
    			27
    		],
    		[
    			1,
    			43
    		],
    		[
    			0,
    			20
    		],
    		[
    			0,
    			11
    		],
    		[
    			1,
    			30
    		],
    		[
    			-1,
    			4
    		],
    		[
    			1,
    			11
    		],
    		[
    			-1,
    			6
    		],
    		[
    			0,
    			11
    		],
    		[
    			1,
    			13
    		],
    		[
    			1,
    			27
    		],
    		[
    			1,
    			19
    		],
    		[
    			0,
    			32
    		],
    		[
    			0,
    			6
    		],
    		[
    			0,
    			15
    		],
    		[
    			0,
    			11
    		],
    		[
    			1,
    			4
    		],
    		[
    			0,
    			29
    		],
    		[
    			0,
    			13
    		],
    		[
    			-1,
    			4
    		],
    		[
    			0,
    			15
    		],
    		[
    			0,
    			14
    		],
    		[
    			-1,
    			7
    		],
    		[
    			2,
    			6
    		],
    		[
    			0,
    			6
    		],
    		[
    			0,
    			11
    		],
    		[
    			-1,
    			18
    		],
    		[
    			-1,
    			11
    		],
    		[
    			2,
    			-6
    		],
    		[
    			1,
    			-4
    		],
    		[
    			1,
    			-3
    		],
    		[
    			1,
    			6
    		],
    		[
    			2,
    			4
    		],
    		[
    			1,
    			-2
    		],
    		[
    			3,
    			7
    		],
    		[
    			1,
    			-1
    		],
    		[
    			1,
    			5
    		]
    	],
    	[
    		[
    			1549,
    			5302
    		],
    		[
    			2,
    			2
    		],
    		[
    			1,
    			-7
    		],
    		[
    			0,
    			-9
    		],
    		[
    			2,
    			-7
    		],
    		[
    			2,
    			0
    		],
    		[
    			4,
    			8
    		],
    		[
    			1,
    			0
    		],
    		[
    			3,
    			-10
    		],
    		[
    			1,
    			-6
    		],
    		[
    			2,
    			-3
    		],
    		[
    			1,
    			-10
    		],
    		[
    			1,
    			-13
    		],
    		[
    			0,
    			-9
    		],
    		[
    			1,
    			-9
    		],
    		[
    			0,
    			-11
    		],
    		[
    			1,
    			-5
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			1,
    			-4
    		],
    		[
    			2,
    			-8
    		],
    		[
    			2,
    			-2
    		],
    		[
    			4,
    			-5
    		],
    		[
    			1,
    			-3
    		],
    		[
    			1,
    			2
    		],
    		[
    			2,
    			-5
    		],
    		[
    			2,
    			0
    		],
    		[
    			2,
    			6
    		],
    		[
    			2,
    			1
    		],
    		[
    			6,
    			13
    		],
    		[
    			1,
    			7
    		],
    		[
    			1,
    			3
    		],
    		[
    			2,
    			-2
    		],
    		[
    			3,
    			2
    		],
    		[
    			3,
    			4
    		],
    		[
    			2,
    			-5
    		],
    		[
    			2,
    			-2
    		],
    		[
    			1,
    			3
    		],
    		[
    			4,
    			-7
    		],
    		[
    			1,
    			-12
    		],
    		[
    			1,
    			1
    		],
    		[
    			2,
    			7
    		],
    		[
    			3,
    			2
    		],
    		[
    			2,
    			-3
    		],
    		[
    			1,
    			5
    		],
    		[
    			5,
    			9
    		],
    		[
    			1,
    			5
    		],
    		[
    			2,
    			-1
    		],
    		[
    			2,
    			-7
    		],
    		[
    			3,
    			0
    		],
    		[
    			3,
    			4
    		],
    		[
    			2,
    			1
    		],
    		[
    			1,
    			6
    		],
    		[
    			3,
    			5
    		],
    		[
    			3,
    			7
    		],
    		[
    			4,
    			4
    		],
    		[
    			4,
    			2
    		],
    		[
    			1,
    			9
    		],
    		[
    			2,
    			4
    		],
    		[
    			1,
    			-3
    		],
    		[
    			4,
    			2
    		],
    		[
    			3,
    			4
    		],
    		[
    			2,
    			-3
    		],
    		[
    			2,
    			1
    		],
    		[
    			3,
    			9
    		],
    		[
    			1,
    			4
    		],
    		[
    			24,
    			0
    		],
    		[
    			18,
    			-1
    		],
    		[
    			16,
    			0
    		]
    	],
    	[
    		[
    			2748,
    			4501
    		],
    		[
    			5,
    			11
    		],
    		[
    			4,
    			11
    		],
    		[
    			1,
    			4
    		],
    		[
    			0,
    			6
    		],
    		[
    			2,
    			5
    		],
    		[
    			0,
    			-6
    		],
    		[
    			4,
    			12
    		],
    		[
    			5,
    			12
    		]
    	],
    	[
    		[
    			2777,
    			4079
    		],
    		[
    			-11,
    			0
    		],
    		[
    			-18,
    			0
    		],
    		[
    			0,
    			66
    		],
    		[
    			0,
    			105
    		]
    	],
    	[
    		[
    			3009,
    			4411
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-1,
    			11
    		],
    		[
    			0,
    			10
    		],
    		[
    			-1,
    			4
    		],
    		[
    			0,
    			-22
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			0,
    			8
    		],
    		[
    			1,
    			11
    		],
    		[
    			0,
    			9
    		],
    		[
    			2,
    			3
    		],
    		[
    			0,
    			6
    		]
    	],
    	[
    		[
    			2996,
    			4355
    		],
    		[
    			1,
    			0
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-1,
    			1
    		],
    		[
    			0,
    			8
    		]
    	],
    	[
    		[
    			3007,
    			4451
    		],
    		[
    			-1,
    			-13
    		],
    		[
    			-1,
    			12
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-2,
    			-12
    		],
    		[
    			1,
    			-14
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			1,
    			-9
    		],
    		[
    			0,
    			-12
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-3,
    			-3
    		],
    		[
    			-1,
    			1
    		]
    	],
    	[
    		[
    			2803,
    			2980
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-4,
    			-9
    		],
    		[
    			-3,
    			-10
    		],
    		[
    			-3,
    			-20
    		],
    		[
    			-2,
    			-13
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			-2,
    			-20
    		],
    		[
    			-1,
    			-23
    		],
    		[
    			0,
    			-9
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-1,
    			-16
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			1,
    			-9
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-4,
    			-9
    		],
    		[
    			-1,
    			-13
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-3,
    			-15
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-1,
    			0
    		],
    		[
    			0,
    			-7
    		],
    		[
    			0,
    			-7
    		],
    		[
    			1,
    			-7
    		],
    		[
    			-1,
    			-13
    		],
    		[
    			-3,
    			-8
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			-3,
    			-10
    		],
    		[
    			-2,
    			-11
    		],
    		[
    			0,
    			-3
    		]
    	],
    	[
    		[
    			2092,
    			4692
    		],
    		[
    			0,
    			55
    		],
    		[
    			0,
    			105
    		],
    		[
    			0,
    			61
    		],
    		[
    			0,
    			96
    		],
    		[
    			0,
    			57
    		]
    	],
    	[
    		[
    			2660,
    			3495
    		],
    		[
    			1,
    			-1
    		],
    		[
    			10,
    			0
    		],
    		[
    			0,
    			-1
    		],
    		[
    			11,
    			0
    		],
    		[
    			11,
    			0
    		],
    		[
    			15,
    			0
    		],
    		[
    			1,
    			5
    		],
    		[
    			7,
    			-1
    		],
    		[
    			-1,
    			-5
    		]
    	],
    	[
    		[
    			2282,
    			1588
    		],
    		[
    			0,
    			8
    		],
    		[
    			-1,
    			12
    		],
    		[
    			-1,
    			7
    		],
    		[
    			0,
    			3
    		],
    		[
    			-1,
    			14
    		],
    		[
    			0,
    			10
    		],
    		[
    			-1,
    			4
    		],
    		[
    			0,
    			8
    		],
    		[
    			0,
    			10
    		],
    		[
    			0,
    			10
    		],
    		[
    			0,
    			14
    		],
    		[
    			0,
    			39
    		],
    		[
    			0,
    			9
    		],
    		[
    			0,
    			18
    		],
    		[
    			0,
    			11
    		],
    		[
    			1,
    			11
    		],
    		[
    			1,
    			8
    		],
    		[
    			1,
    			18
    		],
    		[
    			1,
    			14
    		],
    		[
    			1,
    			3
    		],
    		[
    			0,
    			6
    		],
    		[
    			1,
    			10
    		],
    		[
    			2,
    			10
    		],
    		[
    			0,
    			7
    		],
    		[
    			1,
    			3
    		],
    		[
    			2,
    			21
    		],
    		[
    			0,
    			5
    		],
    		[
    			2,
    			15
    		],
    		[
    			1,
    			3
    		],
    		[
    			0,
    			8
    		],
    		[
    			1,
    			-2
    		],
    		[
    			1,
    			3
    		],
    		[
    			0,
    			10
    		],
    		[
    			0,
    			2
    		],
    		[
    			3,
    			2
    		],
    		[
    			1,
    			5
    		],
    		[
    			0,
    			5
    		],
    		[
    			2,
    			9
    		],
    		[
    			2,
    			4
    		],
    		[
    			2,
    			3
    		],
    		[
    			0,
    			-3
    		],
    		[
    			-3,
    			-9
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			-4,
    			-18
    		],
    		[
    			-2,
    			-13
    		],
    		[
    			-3,
    			-14
    		],
    		[
    			-2,
    			-15
    		],
    		[
    			-1,
    			-14
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-2,
    			-22
    		],
    		[
    			-3,
    			-38
    		],
    		[
    			-2,
    			-23
    		],
    		[
    			-1,
    			-26
    		],
    		[
    			0,
    			-20
    		],
    		[
    			0,
    			-21
    		],
    		[
    			0,
    			-15
    		],
    		[
    			1,
    			-33
    		],
    		[
    			3,
    			-56
    		],
    		[
    			0,
    			-4
    		]
    	],
    	[
    		[
    			2377,
    			2201
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-4,
    			1
    		],
    		[
    			-4,
    			-7
    		],
    		[
    			-12,
    			-33
    		],
    		[
    			-3,
    			-7
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-1,
    			5
    		],
    		[
    			1,
    			8
    		],
    		[
    			1,
    			7
    		],
    		[
    			2,
    			0
    		],
    		[
    			1,
    			3
    		],
    		[
    			0,
    			8
    		],
    		[
    			1,
    			-3
    		],
    		[
    			1,
    			1
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-6,
    			-9
    		],
    		[
    			-1,
    			1
    		],
    		[
    			2,
    			18
    		],
    		[
    			1,
    			18
    		],
    		[
    			-2,
    			12
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			0,
    			8
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			0,
    			-5
    		],
    		[
    			1,
    			-5
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			1,
    			-8
    		],
    		[
    			2,
    			-3
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			1,
    			-3
    		],
    		[
    			0,
    			-12
    		],
    		[
    			0,
    			-11
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			0,
    			1
    		],
    		[
    			-2,
    			-11
    		],
    		[
    			-3,
    			-10
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			0,
    			-7
    		],
    		[
    			0,
    			-5
    		],
    		[
    			2,
    			8
    		],
    		[
    			2,
    			11
    		],
    		[
    			0,
    			3
    		],
    		[
    			4,
    			16
    		],
    		[
    			1,
    			3
    		],
    		[
    			0,
    			7
    		],
    		[
    			3,
    			-2
    		],
    		[
    			-2,
    			-10
    		],
    		[
    			-7,
    			-24
    		],
    		[
    			-2,
    			-11
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-4,
    			-20
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-4,
    			-13
    		],
    		[
    			-6,
    			-24
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-6,
    			-14
    		],
    		[
    			-4,
    			-12
    		],
    		[
    			0,
    			3
    		],
    		[
    			5,
    			15
    		],
    		[
    			2,
    			3
    		],
    		[
    			0,
    			7
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-3,
    			-8
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-1,
    			10
    		],
    		[
    			1,
    			9
    		],
    		[
    			0,
    			2
    		],
    		[
    			-3,
    			-5
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-3,
    			-9
    		],
    		[
    			-1,
    			12
    		],
    		[
    			-1,
    			1
    		],
    		[
    			0,
    			9
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			1,
    			-11
    		],
    		[
    			0,
    			-10
    		],
    		[
    			1,
    			0
    		],
    		[
    			2,
    			-5
    		],
    		[
    			0,
    			-6
    		],
    		[
    			3,
    			-11
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-4,
    			-12
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-1,
    			2
    		],
    		[
    			0,
    			11
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			0,
    			-10
    		],
    		[
    			0,
    			-4
    		],
    		[
    			0,
    			-6
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			-2,
    			-10
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-3,
    			-10
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			1,
    			-5
    		],
    		[
    			1,
    			0
    		],
    		[
    			2,
    			9
    		],
    		[
    			1,
    			-12
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-4,
    			-37
    		],
    		[
    			-1,
    			0
    		],
    		[
    			0,
    			10
    		],
    		[
    			-3,
    			-2
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			0,
    			-11
    		],
    		[
    			0,
    			-7
    		],
    		[
    			2,
    			-6
    		],
    		[
    			1,
    			-3
    		],
    		[
    			-1,
    			-23
    		],
    		[
    			-2,
    			-23
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-1,
    			-16
    		],
    		[
    			-3,
    			-9
    		],
    		[
    			1,
    			11
    		],
    		[
    			-1,
    			4
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-2,
    			-10
    		],
    		[
    			-1,
    			0
    		],
    		[
    			0,
    			-8
    		],
    		[
    			2,
    			-2
    		],
    		[
    			3,
    			6
    		],
    		[
    			1,
    			-1
    		],
    		[
    			-1,
    			-21
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			0,
    			-17
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			0,
    			-10
    		],
    		[
    			0,
    			-7
    		],
    		[
    			0,
    			-11
    		],
    		[
    			1,
    			-7
    		],
    		[
    			1,
    			-8
    		],
    		[
    			0,
    			-10
    		],
    		[
    			1,
    			-14
    		],
    		[
    			0,
    			-4
    		],
    		[
    			1,
    			-11
    		],
    		[
    			-1,
    			-19
    		],
    		[
    			1,
    			-1
    		],
    		[
    			1,
    			-10
    		],
    		[
    			0,
    			-5
    		],
    		[
    			1,
    			-3
    		],
    		[
    			0,
    			-7
    		],
    		[
    			0,
    			-8
    		],
    		[
    			1,
    			1
    		],
    		[
    			0,
    			-9
    		],
    		[
    			0,
    			-8
    		],
    		[
    			0,
    			-5
    		],
    		[
    			1,
    			-13
    		],
    		[
    			2,
    			-2
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			0,
    			-5
    		],
    		[
    			2,
    			1
    		],
    		[
    			0,
    			8
    		],
    		[
    			0,
    			3
    		],
    		[
    			0,
    			-20
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			0,
    			-9
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-2,
    			16
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-1,
    			0
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			0,
    			4
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			-2,
    			9
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-3,
    			8
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-1,
    			10
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			0,
    			5
    		],
    		[
    			0,
    			10
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-1,
    			2
    		],
    		[
    			0,
    			16
    		],
    		[
    			-1,
    			6
    		],
    		[
    			0,
    			13
    		],
    		[
    			-1,
    			4
    		],
    		[
    			0,
    			8
    		],
    		[
    			-1,
    			10
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-1,
    			2
    		],
    		[
    			0,
    			8
    		],
    		[
    			-2,
    			9
    		],
    		[
    			0,
    			7
    		],
    		[
    			1,
    			6
    		],
    		[
    			0,
    			11
    		],
    		[
    			0,
    			5
    		],
    		[
    			-1,
    			9
    		],
    		[
    			0,
    			4
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			12
    		],
    		[
    			0,
    			14
    		],
    		[
    			0,
    			7
    		],
    		[
    			0,
    			7
    		],
    		[
    			-1,
    			2
    		],
    		[
    			1,
    			12
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-2,
    			7
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-2,
    			15
    		],
    		[
    			-1,
    			2
    		],
    		[
    			0,
    			6
    		],
    		[
    			-2,
    			4
    		],
    		[
    			0,
    			8
    		],
    		[
    			0,
    			4
    		],
    		[
    			0,
    			7
    		],
    		[
    			-1,
    			8
    		],
    		[
    			0,
    			7
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-1,
    			13
    		],
    		[
    			-1,
    			4
    		],
    		[
    			0,
    			11
    		],
    		[
    			-4,
    			9
    		],
    		[
    			0,
    			7
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			9
    		],
    		[
    			0,
    			6
    		],
    		[
    			-2,
    			16
    		],
    		[
    			1,
    			5
    		],
    		[
    			-1,
    			9
    		],
    		[
    			0,
    			5
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			7
    		],
    		[
    			1,
    			6
    		],
    		[
    			-2,
    			5
    		],
    		[
    			0,
    			6
    		],
    		[
    			-1,
    			4
    		],
    		[
    			0,
    			14
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			11
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			14
    		],
    		[
    			-1,
    			0
    		],
    		[
    			0,
    			7
    		],
    		[
    			0,
    			8
    		],
    		[
    			-1,
    			22
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-2,
    			8
    		],
    		[
    			1,
    			5
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-3,
    			7
    		],
    		[
    			0,
    			5
    		],
    		[
    			-2,
    			7
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-2,
    			17
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-2,
    			5
    		],
    		[
    			0,
    			10
    		],
    		[
    			0,
    			3
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			0,
    			11
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			13
    		],
    		[
    			-2,
    			9
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-4,
    			-1
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-2,
    			-19
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-2,
    			0
    		],
    		[
    			0,
    			-11
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			0,
    			-8
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			-11
    		],
    		[
    			0,
    			-6
    		],
    		[
    			1,
    			-7
    		],
    		[
    			-2,
    			-9
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-1,
    			-14
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-2,
    			7
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-2,
    			14
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-2,
    			12
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-4,
    			3
    		],
    		[
    			-2,
    			5
    		],
    		[
    			-1,
    			9
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			12
    		],
    		[
    			-2,
    			7
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-2,
    			7
    		],
    		[
    			0,
    			3
    		],
    		[
    			-3,
    			13
    		],
    		[
    			-1,
    			7
    		],
    		[
    			0,
    			17
    		],
    		[
    			-2,
    			9
    		],
    		[
    			0,
    			10
    		],
    		[
    			-1,
    			10
    		],
    		[
    			0,
    			10
    		],
    		[
    			-1,
    			14
    		],
    		[
    			0,
    			6
    		],
    		[
    			0,
    			9
    		],
    		[
    			0,
    			9
    		],
    		[
    			-2,
    			23
    		],
    		[
    			-1,
    			6
    		],
    		[
    			0,
    			5
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			6
    		],
    		[
    			-1,
    			7
    		],
    		[
    			0,
    			10
    		],
    		[
    			-1,
    			11
    		],
    		[
    			0,
    			6
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			10
    		],
    		[
    			-3,
    			11
    		],
    		[
    			0,
    			4
    		],
    		[
    			-2,
    			2
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-2,
    			2
    		],
    		[
    			0,
    			4
    		],
    		[
    			-3,
    			6
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-2,
    			10
    		],
    		[
    			-1,
    			8
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			17
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-1,
    			1
    		],
    		[
    			0,
    			6
    		],
    		[
    			-3,
    			16
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-1,
    			10
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-3,
    			11
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			14
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-1,
    			10
    		],
    		[
    			-1,
    			15
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-2,
    			7
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-1,
    			7
    		]
    	],
    	[
    		[
    			1897,
    			4505
    		],
    		[
    			0,
    			-78
    		],
    		[
    			0,
    			-109
    		],
    		[
    			14,
    			-1
    		],
    		[
    			1,
    			0
    		],
    		[
    			11,
    			0
    		],
    		[
    			16,
    			1
    		],
    		[
    			14,
    			0
    		]
    	],
    	[
    		[
    			2948,
    			5069
    		],
    		[
    			13,
    			1
    		],
    		[
    			8,
    			-1
    		],
    		[
    			7,
    			-2
    		],
    		[
    			11,
    			1
    		],
    		[
    			12,
    			1
    		]
    	],
    	[
    		[
    			2874,
    			3748
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			7
    		]
    	],
    	[
    		[
    			2895,
    			3762
    		],
    		[
    			-2,
    			-13
    		],
    		[
    			-1,
    			-16
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-2,
    			-12
    		],
    		[
    			-2,
    			-22
    		],
    		[
    			-1,
    			-14
    		],
    		[
    			1,
    			-7
    		],
    		[
    			-2,
    			-18
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-2,
    			-11
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			0,
    			-14
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-3,
    			-15
    		],
    		[
    			0,
    			3
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			0,
    			7
    		],
    		[
    			-1,
    			9
    		],
    		[
    			0,
    			10
    		],
    		[
    			0,
    			13
    		],
    		[
    			1,
    			7
    		],
    		[
    			0,
    			13
    		],
    		[
    			1,
    			18
    		],
    		[
    			0,
    			6
    		],
    		[
    			1,
    			11
    		],
    		[
    			3,
    			26
    		],
    		[
    			0,
    			6
    		],
    		[
    			2,
    			2
    		],
    		[
    			1,
    			11
    		],
    		[
    			0,
    			14
    		],
    		[
    			1,
    			2
    		]
    	],
    	[
    		[
    			2842,
    			3875
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-1,
    			4
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-2,
    			-18
    		],
    		[
    			0,
    			-8
    		],
    		[
    			0,
    			-10
    		],
    		[
    			1,
    			-11
    		],
    		[
    			1,
    			-1
    		],
    		[
    			2,
    			2
    		],
    		[
    			1,
    			4
    		],
    		[
    			1,
    			0
    		],
    		[
    			1,
    			7
    		],
    		[
    			1,
    			-5
    		],
    		[
    			0,
    			-12
    		],
    		[
    			2,
    			-10
    		],
    		[
    			0,
    			-8
    		],
    		[
    			3,
    			-10
    		],
    		[
    			2,
    			1
    		],
    		[
    			1,
    			-6
    		],
    		[
    			1,
    			4
    		],
    		[
    			2,
    			-2
    		],
    		[
    			1,
    			-7
    		],
    		[
    			2,
    			-7
    		],
    		[
    			0,
    			-8
    		],
    		[
    			1,
    			-3
    		],
    		[
    			2,
    			-9
    		],
    		[
    			2,
    			-3
    		],
    		[
    			2,
    			-7
    		],
    		[
    			1,
    			-4
    		],
    		[
    			0,
    			-11
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			0,
    			-17
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			1,
    			-4
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-3,
    			10
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			0,
    			4
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-1,
    			12
    		],
    		[
    			-2,
    			5
    		],
    		[
    			0,
    			6
    		],
    		[
    			-2,
    			2
    		],
    		[
    			0,
    			7
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			1,
    			-13
    		],
    		[
    			1,
    			-3
    		],
    		[
    			1,
    			-5
    		],
    		[
    			1,
    			-2
    		],
    		[
    			1,
    			-5
    		],
    		[
    			1,
    			-14
    		],
    		[
    			1,
    			-6
    		],
    		[
    			2,
    			0
    		],
    		[
    			1,
    			-6
    		],
    		[
    			3,
    			-3
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			1,
    			-5
    		],
    		[
    			1,
    			4
    		],
    		[
    			1,
    			-13
    		],
    		[
    			1,
    			-11
    		],
    		[
    			-1,
    			-13
    		],
    		[
    			-2,
    			8
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			1,
    			-6
    		],
    		[
    			1,
    			-9
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			0,
    			-6
    		],
    		[
    			3,
    			2
    		],
    		[
    			-1,
    			-13
    		],
    		[
    			2,
    			1
    		],
    		[
    			0,
    			-4
    		],
    		[
    			1,
    			-3
    		],
    		[
    			1,
    			-8
    		],
    		[
    			-1,
    			-15
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			-1,
    			11
    		],
    		[
    			-3,
    			9
    		],
    		[
    			-2,
    			8
    		],
    		[
    			1,
    			7
    		],
    		[
    			-2,
    			12
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			1,
    			-7
    		],
    		[
    			1,
    			-1
    		],
    		[
    			0,
    			10
    		],
    		[
    			1,
    			-17
    		],
    		[
    			0,
    			-10
    		],
    		[
    			1,
    			-4
    		],
    		[
    			1,
    			-1
    		],
    		[
    			1,
    			-5
    		],
    		[
    			2,
    			-10
    		],
    		[
    			0,
    			-10
    		],
    		[
    			3,
    			1
    		],
    		[
    			0,
    			4
    		],
    		[
    			1,
    			-1
    		],
    		[
    			0,
    			8
    		],
    		[
    			2,
    			1
    		],
    		[
    			1,
    			-4
    		],
    		[
    			4,
    			-7
    		],
    		[
    			2,
    			5
    		],
    		[
    			1,
    			-2
    		],
    		[
    			1,
    			-30
    		],
    		[
    			2,
    			-25
    		],
    		[
    			0,
    			-15
    		]
    	],
    	[
    		[
    			2707,
    			3670
    		],
    		[
    			1,
    			-7
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			2,
    			-6
    		],
    		[
    			0,
    			-6
    		],
    		[
    			0,
    			-10
    		],
    		[
    			2,
    			-10
    		],
    		[
    			0,
    			-4
    		],
    		[
    			3,
    			-2
    		],
    		[
    			1,
    			-7
    		],
    		[
    			1,
    			-7
    		],
    		[
    			4,
    			1
    		],
    		[
    			3,
    			12
    		],
    		[
    			1,
    			1
    		],
    		[
    			0,
    			7
    		],
    		[
    			1,
    			5
    		],
    		[
    			1,
    			-8
    		],
    		[
    			3,
    			-12
    		],
    		[
    			3,
    			8
    		],
    		[
    			4,
    			5
    		],
    		[
    			1,
    			-1
    		],
    		[
    			2,
    			9
    		],
    		[
    			-1,
    			7
    		],
    		[
    			1,
    			8
    		],
    		[
    			2,
    			-6
    		],
    		[
    			1,
    			-4
    		],
    		[
    			1,
    			4
    		],
    		[
    			5,
    			15
    		],
    		[
    			1,
    			1
    		],
    		[
    			1,
    			-10
    		],
    		[
    			5,
    			15
    		],
    		[
    			-1,
    			11
    		],
    		[
    			2,
    			6
    		],
    		[
    			1,
    			6
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-1,
    			9
    		],
    		[
    			1,
    			7
    		],
    		[
    			0,
    			5
    		],
    		[
    			3,
    			22
    		],
    		[
    			0,
    			2
    		],
    		[
    			2,
    			11
    		],
    		[
    			2,
    			9
    		],
    		[
    			2,
    			22
    		],
    		[
    			0,
    			6
    		],
    		[
    			1,
    			10
    		],
    		[
    			1,
    			8
    		],
    		[
    			2,
    			7
    		],
    		[
    			-1,
    			6
    		],
    		[
    			2,
    			9
    		],
    		[
    			2,
    			14
    		],
    		[
    			-1,
    			8
    		],
    		[
    			2,
    			22
    		],
    		[
    			3,
    			-7
    		],
    		[
    			2,
    			-18
    		],
    		[
    			4,
    			-8
    		],
    		[
    			1,
    			2
    		],
    		[
    			2,
    			13
    		],
    		[
    			0,
    			6
    		],
    		[
    			1,
    			11
    		],
    		[
    			1,
    			13
    		],
    		[
    			1,
    			1
    		],
    		[
    			0,
    			8
    		],
    		[
    			1,
    			8
    		],
    		[
    			1,
    			9
    		],
    		[
    			1,
    			11
    		],
    		[
    			4,
    			-17
    		],
    		[
    			2,
    			23
    		],
    		[
    			1,
    			8
    		],
    		[
    			1,
    			-4
    		],
    		[
    			1,
    			4
    		],
    		[
    			1,
    			8
    		],
    		[
    			1,
    			-1
    		],
    		[
    			1,
    			10
    		],
    		[
    			0,
    			3
    		],
    		[
    			2,
    			14
    		],
    		[
    			1,
    			1
    		],
    		[
    			2,
    			10
    		],
    		[
    			-1,
    			6
    		],
    		[
    			1,
    			8
    		],
    		[
    			-1,
    			3
    		],
    		[
    			2,
    			11
    		],
    		[
    			0,
    			7
    		],
    		[
    			0,
    			21
    		],
    		[
    			5,
    			-23
    		],
    		[
    			10,
    			-40
    		],
    		[
    			1,
    			15
    		],
    		[
    			1,
    			16
    		],
    		[
    			1,
    			5
    		]
    	],
    	[
    		[
    			1578,
    			5682
    		],
    		[
    			-3,
    			1
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			2,
    			-3
    		],
    		[
    			1,
    			-16
    		],
    		[
    			0,
    			-4
    		],
    		[
    			1,
    			-9
    		],
    		[
    			1,
    			1
    		],
    		[
    			0,
    			7
    		],
    		[
    			2,
    			-8
    		],
    		[
    			2,
    			-3
    		],
    		[
    			0,
    			-16
    		],
    		[
    			0,
    			-8
    		],
    		[
    			-2,
    			1
    		],
    		[
    			0,
    			7
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-3,
    			11
    		],
    		[
    			0,
    			8
    		],
    		[
    			0,
    			7
    		],
    		[
    			0,
    			8
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-1,
    			7
    		],
    		[
    			1,
    			14
    		],
    		[
    			1,
    			10
    		],
    		[
    			1,
    			8
    		],
    		[
    			2,
    			-1
    		],
    		[
    			0,
    			-8
    		],
    		[
    			2,
    			-6
    		],
    		[
    			0,
    			-6
    		]
    	],
    	[
    		[
    			1579,
    			5537
    		],
    		[
    			1,
    			-9
    		],
    		[
    			0,
    			-9
    		],
    		[
    			1,
    			-7
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-1,
    			3
    		],
    		[
    			1,
    			19
    		],
    		[
    			1,
    			12
    		]
    	],
    	[
    		[
    			1570,
    			5741
    		],
    		[
    			1,
    			-8
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			1,
    			-11
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-2,
    			8
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-2,
    			6
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-1,
    			10
    		],
    		[
    			0,
    			3
    		],
    		[
    			0,
    			5
    		],
    		[
    			2,
    			0
    		],
    		[
    			0,
    			-5
    		],
    		[
    			2,
    			-5
    		],
    		[
    			1,
    			5
    		],
    		[
    			-1,
    			4
    		],
    		[
    			1,
    			7
    		],
    		[
    			2,
    			11
    		],
    		[
    			2,
    			-1
    		],
    		[
    			3,
    			-9
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			1,
    			-3
    		]
    	],
    	[
    		[
    			1574,
    			5738
    		],
    		[
    			2,
    			-7
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			0,
    			9
    		]
    	],
    	[
    		[
    			1572,
    			5742
    		],
    		[
    			1,
    			-7
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			8
    		],
    		[
    			1,
    			5
    		]
    	],
    	[
    		[
    			1549,
    			5302
    		],
    		[
    			-3,
    			2
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-2,
    			12
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			1,
    			10
    		],
    		[
    			0,
    			31
    		],
    		[
    			-1,
    			26
    		],
    		[
    			2,
    			-9
    		],
    		[
    			-1,
    			-16
    		],
    		[
    			1,
    			-6
    		],
    		[
    			2,
    			2
    		],
    		[
    			1,
    			11
    		],
    		[
    			-2,
    			19
    		],
    		[
    			1,
    			7
    		],
    		[
    			2,
    			5
    		],
    		[
    			0,
    			6
    		],
    		[
    			-3,
    			-2
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-2,
    			7
    		],
    		[
    			-1,
    			16
    		],
    		[
    			-1,
    			13
    		],
    		[
    			3,
    			-2
    		],
    		[
    			2,
    			5
    		],
    		[
    			1,
    			0
    		],
    		[
    			2,
    			5
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-2,
    			1
    		],
    		[
    			-1,
    			10
    		],
    		[
    			-3,
    			2
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			1,
    			-14
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			1,
    			13
    		],
    		[
    			-1,
    			18
    		],
    		[
    			-1,
    			24
    		],
    		[
    			0,
    			13
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-2,
    			10
    		],
    		[
    			0,
    			11
    		],
    		[
    			-1,
    			24
    		],
    		[
    			0,
    			16
    		],
    		[
    			-2,
    			22
    		],
    		[
    			-1,
    			4
    		],
    		[
    			0,
    			9
    		],
    		[
    			-2,
    			4
    		],
    		[
    			0,
    			5
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-1,
    			15
    		],
    		[
    			-1,
    			25
    		],
    		[
    			-1,
    			13
    		],
    		[
    			1,
    			3
    		],
    		[
    			1,
    			27
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-1,
    			7
    		],
    		[
    			4,
    			-1
    		],
    		[
    			6,
    			-19
    		],
    		[
    			4,
    			-4
    		],
    		[
    			3,
    			-8
    		],
    		[
    			2,
    			-8
    		],
    		[
    			4,
    			-3
    		],
    		[
    			4,
    			-1
    		],
    		[
    			2,
    			2
    		],
    		[
    			3,
    			-6
    		],
    		[
    			1,
    			3
    		],
    		[
    			1,
    			-3
    		],
    		[
    			3,
    			-3
    		],
    		[
    			4,
    			0
    		],
    		[
    			3,
    			9
    		],
    		[
    			2,
    			-8
    		],
    		[
    			1,
    			-8
    		],
    		[
    			2,
    			3
    		],
    		[
    			1,
    			-1
    		],
    		[
    			0,
    			-4
    		],
    		[
    			2,
    			-4
    		],
    		[
    			0,
    			12
    		],
    		[
    			1,
    			4
    		],
    		[
    			2,
    			2
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			1,
    			-7
    		],
    		[
    			1,
    			7
    		],
    		[
    			1,
    			2
    		],
    		[
    			0,
    			-16
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			2,
    			-11
    		],
    		[
    			0,
    			-12
    		],
    		[
    			-1,
    			0
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			1,
    			18
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			-1,
    			-20
    		],
    		[
    			-2,
    			-11
    		],
    		[
    			-4,
    			-29
    		],
    		[
    			-1,
    			-19
    		],
    		[
    			1,
    			1
    		],
    		[
    			0,
    			5
    		],
    		[
    			4,
    			37
    		],
    		[
    			3,
    			12
    		],
    		[
    			3,
    			4
    		],
    		[
    			0,
    			12
    		],
    		[
    			2,
    			12
    		],
    		[
    			3,
    			14
    		],
    		[
    			-1,
    			8
    		],
    		[
    			2,
    			0
    		],
    		[
    			1,
    			-7
    		],
    		[
    			0,
    			-26
    		],
    		[
    			-1,
    			1
    		],
    		[
    			0,
    			-7
    		],
    		[
    			1,
    			-2
    		],
    		[
    			0,
    			-9
    		],
    		[
    			0,
    			-3
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			0,
    			-6
    		],
    		[
    			1,
    			-2
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			0,
    			-14
    		],
    		[
    			0,
    			-4
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			1,
    			-7
    		],
    		[
    			-2,
    			-12
    		],
    		[
    			-2,
    			12
    		],
    		[
    			0,
    			11
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			3,
    			-14
    		],
    		[
    			-2,
    			-14
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-2,
    			15
    		],
    		[
    			1,
    			8
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			1,
    			-12
    		],
    		[
    			1,
    			-16
    		],
    		[
    			2,
    			-4
    		],
    		[
    			1,
    			0
    		],
    		[
    			3,
    			14
    		],
    		[
    			0,
    			13
    		],
    		[
    			1,
    			9
    		],
    		[
    			3,
    			-5
    		],
    		[
    			1,
    			4
    		],
    		[
    			-1,
    			6
    		],
    		[
    			3,
    			5
    		],
    		[
    			0,
    			8
    		],
    		[
    			-1,
    			13
    		],
    		[
    			0,
    			4
    		],
    		[
    			-1,
    			6
    		],
    		[
    			0,
    			11
    		],
    		[
    			1,
    			4
    		],
    		[
    			0,
    			6
    		],
    		[
    			-2,
    			6
    		],
    		[
    			2,
    			14
    		],
    		[
    			-1,
    			9
    		],
    		[
    			0,
    			5
    		],
    		[
    			2,
    			8
    		],
    		[
    			0,
    			19
    		],
    		[
    			3,
    			5
    		],
    		[
    			0,
    			10
    		],
    		[
    			-2,
    			4
    		],
    		[
    			-2,
    			14
    		],
    		[
    			0,
    			12
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			10
    		],
    		[
    			0,
    			12
    		],
    		[
    			4,
    			0
    		],
    		[
    			1,
    			7
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-3,
    			7
    		],
    		[
    			-2,
    			13
    		],
    		[
    			-2,
    			-4
    		],
    		[
    			-1,
    			5
    		],
    		[
    			1,
    			8
    		],
    		[
    			-2,
    			3
    		],
    		[
    			3,
    			5
    		],
    		[
    			1,
    			-3
    		],
    		[
    			1,
    			-7
    		],
    		[
    			1,
    			-2
    		],
    		[
    			1,
    			6
    		],
    		[
    			0,
    			13
    		],
    		[
    			1,
    			7
    		],
    		[
    			-2,
    			11
    		],
    		[
    			0,
    			11
    		],
    		[
    			0,
    			7
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-3,
    			0
    		],
    		[
    			-1,
    			5
    		],
    		[
    			-1,
    			10
    		],
    		[
    			-2,
    			6
    		],
    		[
    			1,
    			8
    		],
    		[
    			-2,
    			2
    		],
    		[
    			0,
    			3
    		],
    		[
    			2,
    			9
    		],
    		[
    			18,
    			0
    		],
    		[
    			10,
    			-1
    		],
    		[
    			17,
    			1
    		],
    		[
    			12,
    			-1
    		],
    		[
    			20,
    			0
    		],
    		[
    			16,
    			0
    		],
    		[
    			16,
    			0
    		],
    		[
    			18,
    			0
    		],
    		[
    			16,
    			1
    		],
    		[
    			16,
    			-1
    		]
    	],
    	[
    		[
    			2472,
    			5446
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			0,
    			9
    		],
    		[
    			0,
    			6
    		],
    		[
    			1,
    			0
    		],
    		[
    			0,
    			-9
    		]
    	],
    	[
    		[
    			2462,
    			5431
    		],
    		[
    			2,
    			2
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			6
    		]
    	],
    	[
    		[
    			2468,
    			5412
    		],
    		[
    			-3,
    			-5
    		],
    		[
    			-3,
    			-12
    		],
    		[
    			-1,
    			6
    		],
    		[
    			2,
    			3
    		],
    		[
    			3,
    			14
    		],
    		[
    			2,
    			-6
    		]
    	],
    	[
    		[
    			2468,
    			5433
    		],
    		[
    			1,
    			0
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-2,
    			-1
    		],
    		[
    			0,
    			6
    		],
    		[
    			2,
    			3
    		]
    	],
    	[
    		[
    			2462,
    			5447
    		],
    		[
    			4,
    			2
    		],
    		[
    			1,
    			-10
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			-1,
    			7
    		],
    		[
    			-2,
    			3
    		],
    		[
    			0,
    			6
    		]
    	],
    	[
    		[
    			2427,
    			5386
    		],
    		[
    			2,
    			-5
    		],
    		[
    			4,
    			2
    		],
    		[
    			5,
    			8
    		],
    		[
    			2,
    			5
    		],
    		[
    			1,
    			0
    		],
    		[
    			3,
    			6
    		],
    		[
    			1,
    			0
    		],
    		[
    			1,
    			5
    		],
    		[
    			2,
    			3
    		],
    		[
    			1,
    			6
    		],
    		[
    			2,
    			-4
    		],
    		[
    			1,
    			3
    		],
    		[
    			1,
    			0
    		],
    		[
    			3,
    			11
    		],
    		[
    			0,
    			4
    		],
    		[
    			2,
    			-2
    		],
    		[
    			1,
    			5
    		],
    		[
    			1,
    			0
    		],
    		[
    			2,
    			-11
    		],
    		[
    			-1,
    			-14
    		],
    		[
    			-2,
    			-13
    		],
    		[
    			1,
    			-10
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			1,
    			-3
    		],
    		[
    			4,
    			12
    		],
    		[
    			1,
    			8
    		],
    		[
    			4,
    			-17
    		],
    		[
    			2,
    			-3
    		],
    		[
    			0,
    			1
    		],
    		[
    			3,
    			-4
    		]
    	],
    	[
    		[
    			2551,
    			5085
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			0,
    			-13
    		],
    		[
    			-4,
    			-2
    		],
    		[
    			-2,
    			-2
    		],
    		[
    			0,
    			-7
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-1,
    			-13
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			-22
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			1,
    			-6
    		],
    		[
    			2,
    			0
    		],
    		[
    			2,
    			13
    		],
    		[
    			2,
    			6
    		],
    		[
    			1,
    			1
    		],
    		[
    			1,
    			9
    		],
    		[
    			0,
    			6
    		],
    		[
    			3,
    			21
    		],
    		[
    			3,
    			6
    		],
    		[
    			1,
    			-1
    		],
    		[
    			2,
    			8
    		],
    		[
    			1,
    			15
    		],
    		[
    			1,
    			9
    		],
    		[
    			2,
    			9
    		],
    		[
    			0,
    			16
    		],
    		[
    			2,
    			-1
    		],
    		[
    			2,
    			5
    		],
    		[
    			0,
    			13
    		],
    		[
    			3,
    			8
    		],
    		[
    			1,
    			-1
    		],
    		[
    			0,
    			-9
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			1
    		],
    		[
    			0,
    			-19
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			-9
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-1,
    			-16
    		],
    		[
    			-2,
    			-15
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			-2,
    			-43
    		],
    		[
    			1,
    			-17
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-2,
    			-6
    		],
    		[
    			-2,
    			-8
    		],
    		[
    			0,
    			-10
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			-1,
    			-26
    		],
    		[
    			0,
    			-13
    		],
    		[
    			1,
    			-8
    		],
    		[
    			-1,
    			-16
    		],
    		[
    			-2,
    			-22
    		],
    		[
    			0,
    			-13
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-2,
    			-13
    		],
    		[
    			-1,
    			-27
    		],
    		[
    			1,
    			-15
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			1,
    			-12
    		],
    		[
    			-1,
    			-6
    		],
    		[
    			0,
    			-8
    		],
    		[
    			2,
    			-10
    		],
    		[
    			-1,
    			-10
    		],
    		[
    			1,
    			-10
    		],
    		[
    			2,
    			-10
    		],
    		[
    			-1,
    			-14
    		],
    		[
    			-1,
    			-12
    		],
    		[
    			0,
    			-22
    		],
    		[
    			1,
    			-7
    		]
    	],
    	[
    		[
    			2570,
    			5129
    		],
    		[
    			-2,
    			2
    		],
    		[
    			1,
    			13
    		],
    		[
    			3,
    			-1
    		],
    		[
    			-2,
    			-14
    		]
    	],
    	[
    		[
    			3171,
    			69
    		],
    		[
    			1,
    			6
    		],
    		[
    			1,
    			2
    		],
    		[
    			1,
    			-6
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-1,
    			3
    		]
    	],
    	[
    		[
    			3099,
    			35
    		],
    		[
    			1,
    			1
    		],
    		[
    			1,
    			-5
    		],
    		[
    			-1,
    			-7
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			-1,
    			5
    		],
    		[
    			0,
    			6
    		],
    		[
    			1,
    			1
    		]
    	],
    	[
    		[
    			3171,
    			40
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-3,
    			-7
    		],
    		[
    			0,
    			2
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-1,
    			7
    		],
    		[
    			2,
    			4
    		],
    		[
    			2,
    			4
    		],
    		[
    			1,
    			1
    		],
    		[
    			2,
    			-4
    		]
    	],
    	[
    		[
    			3140,
    			104
    		],
    		[
    			3,
    			0
    		],
    		[
    			0,
    			-2
    		],
    		[
    			2,
    			1
    		],
    		[
    			2,
    			-3
    		],
    		[
    			1,
    			-2
    		],
    		[
    			1,
    			3
    		],
    		[
    			3,
    			-5
    		],
    		[
    			0,
    			3
    		],
    		[
    			2,
    			-3
    		],
    		[
    			1,
    			2
    		],
    		[
    			2,
    			-4
    		],
    		[
    			0,
    			-4
    		],
    		[
    			1,
    			-1
    		],
    		[
    			1,
    			-4
    		],
    		[
    			2,
    			-4
    		],
    		[
    			1,
    			1
    		],
    		[
    			1,
    			-13
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			1,
    			-11
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-1,
    			-3
    		],
    		[
    			-1,
    			-8
    		],
    		[
    			-1,
    			-17
    		],
    		[
    			-1,
    			-1
    		],
    		[
    			0,
    			-7
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-1,
    			-4
    		],
    		[
    			-1,
    			2
    		],
    		[
    			-2,
    			-7
    		],
    		[
    			-2,
    			6
    		],
    		[
    			0,
    			-6
    		],
    		[
    			-2,
    			3
    		],
    		[
    			-1,
    			6
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			-1,
    			-5
    		],
    		[
    			-2,
    			9
    		],
    		[
    			-1,
    			0
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-2,
    			-3
    		],
    		[
    			-1,
    			4
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-1,
    			-2
    		],
    		[
    			0,
    			-5
    		],
    		[
    			-4,
    			-4
    		],
    		[
    			-1,
    			1
    		],
    		[
    			0,
    			4
    		],
    		[
    			-2,
    			0
    		],
    		[
    			-2,
    			-5
    		],
    		[
    			-1,
    			3
    		],
    		[
    			-2,
    			0
    		],
    		[
    			0,
    			14
    		],
    		[
    			1,
    			13
    		],
    		[
    			0,
    			12
    		],
    		[
    			1,
    			5
    		],
    		[
    			0,
    			4
    		],
    		[
    			-1,
    			14
    		],
    		[
    			-1,
    			1
    		],
    		[
    			-1,
    			10
    		],
    		[
    			3,
    			12
    		],
    		[
    			0,
    			9
    		],
    		[
    			0,
    			8
    		],
    		[
    			2,
    			2
    		],
    		[
    			2,
    			-1
    		],
    		[
    			1,
    			-4
    		],
    		[
    			2,
    			-1
    		],
    		[
    			1,
    			1
    		],
    		[
    			2,
    			0
    		],
    		[
    			2,
    			-3
    		],
    		[
    			3,
    			4
    		],
    		[
    			2,
    			-1
    		],
    		[
    			2,
    			-4
    		],
    		[
    			1,
    			3
    		]
    	]
    ];
    var transform$1 = {
    	scale: [
    		0.035895715771577165,
    		0.005342849784978497
    	],
    	translate: [
    		-179.14734,
    		17.929406
    	]
    };
    var bbox = [
    	-179.14734,
    	17.929406,
    	179.773922,
    	71.352561
    ];
    var usStates = {
    	type: type,
    	objects: objects,
    	arcs: arcs,
    	transform: transform$1,
    	bbox: bbox
    };

    /* src/App.svelte generated by Svelte v3.32.2 */

    const file$7 = "src/App.svelte";

    // (42:8) <Svg>
    function create_default_slot_1(ctx) {
    	let map;
    	let current;

    	map = new Map_svg({
    			props: { projection: geoAlbersUsa },
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
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(42:8) <Svg>",
    		ctx
    	});

    	return block;
    }

    // (37:6) <LayerCake         z='FOO'         data={geojson}        >
    function create_default_slot(ctx) {
    	let svg;
    	let current;

    	svg = new Svg({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(svg.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(svg, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const svg_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				svg_changes.$$scope = { dirty, ctx };
    			}

    			svg.$set(svg_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(svg.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(svg.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(svg, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(37:6) <LayerCake         z='FOO'         data={geojson}        >",
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
    	let t5;
    	let p1;
    	let t6;
    	let a;
    	let t8;
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
    				data: /*geojson*/ ctx[0],
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
    			t6 = text("Data as of March 18, 2021 | Source: Centers for Disease Control and Prevention | Get the ");
    			a = element("a");
    			a.textContent = "data";
    			t8 = text(" | By John Keefe");
    			attr_dev(h1, "class", "svelte-qq3w1o");
    			add_location(h1, file$7, 23, 1, 828);
    			attr_dev(p0, "class", "g-leadin svelte-qq3w1o");
    			add_location(p0, file$7, 25, 1, 876);
    			attr_dev(div, "class", "chart-container svelte-qq3w1o");
    			add_location(div, file$7, 35, 4, 1362);
    			attr_dev(a, "href", "https://covid.cdc.gov/covid-data-tracker/COVIDData/getAjaxData?id=vaccination_data");
    			add_location(a, file$7, 60, 112, 1915);
    			attr_dev(p1, "class", "g-notes svelte-qq3w1o");
    			add_location(p1, file$7, 60, 4, 1807);
    			attr_dev(main, "class", "svelte-qq3w1o");
    			add_location(main, file$7, 21, 0, 819);
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
    			append_dev(main, t5);
    			append_dev(main, p1);
    			append_dev(p1, t6);
    			append_dev(p1, a);
    			append_dev(p1, t8);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const layercake_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				layercake_changes.$$scope = { dirty, ctx };
    			}

    			layercake.$set(layercake_changes);
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

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const geojson = feature(usStates, usStates.objects.collection);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		MapKey,
    		SvgImage,
    		HtmlRender,
    		LayerCake,
    		Html,
    		Svg,
    		feature,
    		geoAlbersUsa,
    		Map: Map_svg,
    		usStates,
    		geojson
    	});

    	return [geojson];
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
