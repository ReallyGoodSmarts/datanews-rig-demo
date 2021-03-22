<script>
    export let filename
    let w
</script>

<main>
    <div bind:clientWidth={w}>
    	<img src="{filename}" width="{w}">
    </div>
</main>