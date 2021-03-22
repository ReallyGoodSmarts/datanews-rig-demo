<script>
    export let filename = ''
	let htmlContent = ''
    
	fetch(`./${filename}`).then(response => {
		console.dir(response)
		return response.text();
	}).then(html => {
		htmlContent = html
	})
    
</script>

<p>
	{@html htmlContent}
</p>
