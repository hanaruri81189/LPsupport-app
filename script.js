document.addEventListener('DOMContentLoaded', () => {
    const generatorForm = document.getElementById('generator-form');
    const conceptInput = document.getElementById('concept-input');
    const loader = document.getElementById('loader');
    const outputSection = document.getElementById('output-section');
    const designOutput = document.getElementById('design-output');
    const catchphraseOutput = document.getElementById('catchphrase-output');
    const bodyCopyOutput = document.getElementById('body-copy-output');
    const copyButton = document.getElementById('copy-button');

    generatorForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const concept = conceptInput.value.trim();
        if (!concept) {
            alert('コンセプトを入力してください。');
            return;
        }

        // Show loader, hide output
        loader.classList.remove('hidden');
        outputSection.classList.add('hidden');

        try {
            // サーバーレス関数のエンドポイントにリクエストを送信
            const response = await fetch('/api/generate', { // ここを変更
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ concept: concept }), // コンセプトだけを送る
            });

            if (!response.ok) {
                // サーバーレス関数からのエラーレスポンスを処理
                const errorData = await response.json();
                throw new Error(`API Error: ${response.status} - ${errorData.error || response.statusText}`);
            }

            const data = await response.json();
            // サーバーレス関数から直接パース済みのJSONを受け取ることを想定
            const parsedData = data; 
            
            designOutput.textContent = parsedData.design_proposal || '提案がありません。';
            catchphraseOutput.innerHTML = (parsedData.catchphrase_proposals && parsedData.catchphrase_proposals.length > 0)
                ? parsedData.catchphrase_proposals.map(cp => `<p>${cp}</p>`).join('')
                : '提案がありません。';
            bodyCopyOutput.value = parsedData.body_copy || '提案がありません。';

            // Show output, hide loader
            outputSection.classList.remove('hidden');

        } catch (error) {
            console.error('Error generating content:', error);
            alert(`コンテンツの生成中にエラーが発生しました: ${error.message || '不明なエラー'}`);
        } finally {
            loader.classList.add('hidden');
        }
    });

    copyButton.addEventListener('click', () => {
        bodyCopyOutput.select();
        bodyCopyOutput.setSelectionRange(0, 99999); // For mobile devices
        document.execCommand('copy');
        alert('ボディコピーをクリップボードにコピーしました！');
    });
});
