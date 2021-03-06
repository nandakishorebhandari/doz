const {REGEX, ATTR} = require('../constants');
const castStringTo = require('../utils/cast-string-to');
const objectPath = require('../utils/object-path');

function isEventAttribute(name) {
    return REGEX.IS_LISTENER.test(name);
}

function isBindAttribute(name) {
    return name === ATTR.BIND;
}

function isRefAttribute(name) {
    return name === ATTR.REF;
}

function canBind($target) {
    return ['INPUT', 'TEXTAREA'].indexOf($target.nodeName) !== -1
}

function setAttribute($target, name, value, cmp) {
    if (isCustomAttribute(name)) {
    } else if (name === 'className') {
        $target.setAttribute('class', value);
    } else if (typeof value === 'boolean') {
        setBooleanAttribute($target, name, value);
    } else if (typeof value === 'object') {
        try {
            $target.setAttribute(name, JSON.stringify(value));
        } catch (e) {

        }
    } else {
        $target.setAttribute(name, value);
    }
}

function removeAttribute($target, name, value) {
    if (isCustomAttribute(name)) {
    } else if (name === 'className') {
        $target.removeAttribute('class');
    } else if (typeof value === 'boolean') {
        removeBooleanAttribute($target, name);
    } else {
        $target.removeAttribute(name);
    }
}

function updateAttribute($target, name, newVal, oldVal) {
    if (!newVal) {
        removeAttribute($target, name, oldVal);
    } else if (!oldVal || newVal !== oldVal) {
        setAttribute($target, name, newVal);
    }
}

function updateAttributes($target, newProps, oldProps = {}, cmp) {
    const props = Object.assign({}, newProps, oldProps);
    let updated = [];
    Object.keys(props).forEach(name => {
        //const res = newProps[name] !== oldProps[name];
        updateAttribute($target, name, newProps[name], oldProps[name]);
        if (newProps[name] !== oldProps[name]){
            let obj = {};
            obj[name] = newProps[name];
            updated.push(obj);
        }
    });

    return updated;
}

function isCustomAttribute(name) {
    return isEventAttribute(name)
        || isBindAttribute(name)
        || isRefAttribute(name)
        || name === 'forceupdate';
}

function setBooleanAttribute($target, name, value) {
    if (value) {
        $target.setAttribute(name, value);
        $target[name] = true;
    } else {
        $target[name] = false;
    }
}

function removeBooleanAttribute($target, name) {
    $target.removeAttribute(name);
    $target[name] = false;
}

function extractEventName(name) {
    return name.slice(2).toLowerCase();
}

function trimQuotes(str) {
    return str.replace(REGEX.TRIM_QUOTES, '$1');
}

function addEventListener($target, name, value, cmp) {

    if (!isEventAttribute(name)) return;

    let match = value.match(REGEX.GET_LISTENER);

    // Add only if is a static component
    if (cmp._isStatic)
        $target.dataset[name] = value;

    if (match) {
        let args = null;
        let handler = match[1];
        let stringArgs = match[2];
        if (stringArgs) {
            args = stringArgs.split(',').map(item => {
                item = item.trim();
                return item === 'this' ? cmp : castStringTo(trimQuotes(item))
            })
        }

        let isParentMethod = handler.match(REGEX.IS_PARENT_METHOD);

        if (isParentMethod) {
            handler = isParentMethod[1];
            cmp = cmp.parent;
        }

        const method = objectPath(handler, cmp);

        if (method !== undefined) {
            value = args
                ? method.bind(cmp, ...args)
                : method.bind(cmp);
        }
    }

    if (typeof value === 'function')
        $target.addEventListener(
            extractEventName(name),
            value
        );

}

function setBind($target, name, value, cmp) {
    if (!isBindAttribute(name) || !canBind($target)) return;
    if (typeof cmp.props[value] !== 'undefined') {
        ['compositionstart', 'compositionend', 'input', 'change']
            .forEach(function (event) {
                $target.addEventListener(event, function () {
                    cmp.props[value] = this.value;
                });
            });
        if (cmp._boundElements.hasOwnProperty(value)) {
            cmp._boundElements[value].push($target);
        } else {
            cmp._boundElements[value] = [$target];
        }
    }
}

function setRef($target, name, value, cmp) {
    if (!isRefAttribute(name)) return;
    cmp.ref[value] = $target
}

function attach($target, props, cmp) {
    Object.keys(props).forEach(name => {
        setAttribute($target, name, props[name], cmp);
        addEventListener($target, name, props[name], cmp);
        setBind($target, name, props[name], cmp);
        setRef($target, name, props[name], cmp);
    });

    for (let i in $target.dataset) {
        if ($target.dataset.hasOwnProperty(i) && REGEX.IS_LISTENER.test(i)) {
            addEventListener($target, i, $target.dataset[i], cmp);
        }
    }
}

module.exports = {
    attach,
    updateAttributes
};