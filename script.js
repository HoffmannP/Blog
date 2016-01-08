var GistURL = {
    list: function (name) {
        return 'https://api.github.com/users/' + name + '/gists';
    },
    gist: function (id) {
        return 'https://api.github.com/gists/' + id;
    }
};

function authorizeIfAvailable(xhr) {
    if (typeof OAuthToken !== 'undefined') {
        xhr.setRequestHeader('Authorization', 'token ' + OAuthToken);
    }
}

function loadArticles(name, filter, limit) {
    var articles = [];
    loadArticlePage(
        GistURL.list(name),
        handleArticle.bind(articles, filter, limit),
        doneLoading.bind(articles)
    );
}

function loadArticlePage(uri, handle, done) {
    $.ajax({
        url: uri,
        beforeSend: authorizeIfAvailable,
        success: function (data, status, xHR) {
            for (var i = 0, l = data.length; i < l; i++) {
                if (handle(data[i]) === false) {
                    return done();
                }
            }
            var links = parseLinkHeader(xHR);
            if (links.next) {
                loadArticlePage(links.next, handle, done);
            } else {
                done();
            }
        }
    });
}

function parseLinkHeader(request) {
    var link = request.getResponseHeader('Link');
    if (link === null) {
        return {};
    }
    var map = link.split(',').reduce(reduceArray);
    return map;
}

function reduceArray(hash, element) {
    if (typeof hash == 'string') {
        hash = reduceArray({}, hash);
    }
    var parts = element.trim().split(';');
    hash[parts[1].slice(6, -1)] = parts[0].slice(1, -1);
    return hash;
}

function handleArticle(filter, limit, article) {
    if (filter(article)) {
        this.push(article);
    }
    return limit === undefined || this.length < limit;
}

function doneLoading() {
    var list = $('<div>').addClass('list');
    list.append($('<h1>').text('Artikelliste'));
    var article, ul = $('<ul>');
    for (var i = 0, l = this.length; i < l; i++) {
        article = this[i];
        ul.append('<li><a href="#' + article.id + '">' + tagFreeDescription(article) + '</a></li>');
    }
    list.append(ul).appendTo('body');
}

function tagFreeDescription(article) {
    var description = article.description;
    var tag = new RegExp('\\w+:\\w*');
    return description.replace(tag, '').trim();
}

function filterDescriptionMustContainTag(tag) {
    var searchTag = tag + ':';
    return function (article) {
        return article.description.indexOf(searchTag) > -1;
    };
}

function findArticle(id) {
    $.ajax({
        url: GistURL.gist(id),
        beforeSend: authorizeIfAvailable,
        success: function (gist) {
            for (var filename in gist.files) {
                if (gist.files[filename].language == 'Markdown') {
                    $.get(gist.files[filename].raw_url, showArticle.bind(null, gist));
                    return;
                }
            }
        }
    });
}

function showArticle(gist, article_raw) {
    var converter = new showdown.Converter();
    $('<div>').addClass('article')
        .append(converter.makeHtml(article_raw)
    ).appendTo('body');
    activateDisqus(gist);
}

function activateDisqus(gist) {
    $('div.article').append(
        $('<div>').attr('id', 'disqus_thread')
    );
    var disqus_config = function () {
        this.page.url = gist.url;
        this.page.identifier = gist.owner.id + '/' + gist.id;
    };
    $('head').append($('<script>')
        .prop('data-timestamp', +new Date())
        .prop('src', '//hoffmannp.disqus.com/embed.js')
    );
}

function loadArticle() {
    var id = location.hash.substr(1);
    if (id) {
        findArticle(id);
    }
}

window.onhashchange = loadArticle;
$(function main() {
    loadArticles('HoffmannP', filterDescriptionMustContainTag('Artikel'));
    loadArticle();
});

