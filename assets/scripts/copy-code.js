const allPreBlocks = document.querySelectorAll('body main div article div.post-content.e-content pre');

allPreBlocks.forEach((preBlock, index) => {
  const code = allPreBlocks[index].innerText;

  preBlock.addEventListener('click', () => {
    window.navigator.clipboard.writeText(code);
    preBlock.classList.add('copied');

    setTimeout(() => {
      preBlock.classList.remove('copied');
    }, 1000);
  });
});