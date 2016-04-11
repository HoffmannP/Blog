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
