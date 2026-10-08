// Código C exibido no editor + textos de apoio de cada algoritmo.
// Cada linha pode terminar com ⟦tag⟧: a tag é removida do texto exibido e serve
// para os geradores de passos apontarem a linha exata que está "executando".
// O marcador __ARR__ vira a lista de valores que o usuário escolheu.
(function () {
  const S = (globalThis.SortViz = globalThis.SortViz || {});

  const MAIN = (chamada) => String.raw`
int main(void) {
    int arr[] = {__ARR__};⟦decl⟧
    int n = sizeof(arr) / sizeof(arr[0]);⟦nDecl⟧
    ${chamada}⟦chama⟧
    for (int i = 0; i < n; i++) printf("%d ", arr[i]);⟦print⟧
    printf("\n");
    return 0;
}`;

  const BUBBLE = String.raw`#include <stdio.h>

// Bubble Sort: compara vizinhos e troca os que estão fora de ordem
void bubbleSort(int arr[], int n) {⟦fn⟧
    for (int i = 0; i < n - 1; i++) {⟦forI⟧
        for (int j = 0; j < n - i - 1; j++) {⟦forJ⟧
            if (arr[j] > arr[j + 1]) {⟦if⟧
                int temp = arr[j];⟦t1⟧
                arr[j] = arr[j + 1];⟦t2⟧
                arr[j + 1] = temp;⟦t3⟧
            }
        }
    }
}⟦fim⟧
` + MAIN('bubbleSort(arr, n);');

  const SELECTION = String.raw`#include <stdio.h>

// Selection Sort: acha o menor do trecho restante e põe na posição i
void selectionSort(int arr[], int n) {⟦fn⟧
    for (int i = 0; i < n - 1; i++) {⟦forI⟧
        int min = i;⟦min⟧
        for (int j = i + 1; j < n; j++) {⟦forJ⟧
            if (arr[j] < arr[min]) {⟦if⟧
                min = j;⟦setMin⟧
            }
        }
        if (min != i) {⟦ifTroca⟧
            int temp = arr[i];⟦t1⟧
            arr[i] = arr[min];⟦t2⟧
            arr[min] = temp;⟦t3⟧
        }
    }
}⟦fim⟧
` + MAIN('selectionSort(arr, n);');

  const INSERTION = String.raw`#include <stdio.h>

// Insertion Sort: insere cada elemento na parte já ordenada
void insertionSort(int arr[], int n) {⟦fn⟧
    for (int i = 1; i < n; i++) {⟦forI⟧
        int chave = arr[i];⟦chave⟧
        int j = i - 1;⟦jInit⟧
        while (j >= 0 && arr[j] > chave) {⟦while⟧
            arr[j + 1] = arr[j];⟦shift⟧
            j--;⟦jDec⟧
        }
        arr[j + 1] = chave;⟦coloca⟧
    }
}⟦fim⟧
` + MAIN('insertionSort(arr, n);');

  // Quick Sort no estilo do usuário: float v[], inicio/fim, troca inline com aux
  const QUICK = String.raw`#include <stdio.h>

void quickSort(float v[], int inicio, int fim)⟦qFn⟧
{
	int i, j;
	float pivo, aux;

	if(inicio >= fim)⟦qIf⟧
		return;⟦qRet⟧

	pivo = v[fim];⟦pPivo⟧
	i = inicio;⟦pI⟧

	for(j = inicio; j < fim; j++)⟦pFor⟧
	{
		if(v[j] < pivo)⟦pIf⟧
		{
			aux = v[i];⟦s1⟧
			v[i] = v[j];⟦s2⟧
			v[j] = aux;⟦s3⟧
			i++;⟦pInc⟧
		}
	}

	aux = v[i];⟦f1⟧
	v[i] = v[fim];⟦f2⟧
	v[fim] = aux;⟦f3⟧

	printf("Pivo: %.2f | inicio: %d | fim: %d | posicao final do pivo: %d\n", pivo, inicio, fim, i);⟦pPrint⟧

	quickSort(v, inicio, i - 1);⟦qEsq⟧
	quickSort(v, i + 1, fim);⟦qDir⟧
}⟦qFim⟧

int main(void)
{
	float v[] = {__ARR__};⟦decl⟧
	int n = sizeof(v) / sizeof(v[0]);⟦nDecl⟧
	quickSort(v, 0, n - 1);⟦chama⟧
	for (int i = 0; i < n; i++) printf("%.2f ", v[i]);⟦print⟧
	printf("\n");
	return 0;
}`;

  const ALGORITMOS = {
    bubble: {
      id: 'bubble', arquivo: 'bubble_sort.c', nome: 'Bubble Sort', funcao: 'bubbleSort',
      rotuloTrocas: 'trocas', src: BUBBLE,
      resumo: [
        'Percorre o vetor comparando cada par de vizinhos. Se o da esquerda é maior, os dois trocam de lugar.',
        'Ao fim de cada passada, o maior valor restante "borbulha" até o final e fica na posição definitiva.',
        'Repete n - 1 passadas. Esta versão sempre faz todas elas, mesmo se o vetor já estiver ordenado.',
      ],
      complexidade: { melhor: 'O(n²)', medio: 'O(n²)', pior: 'O(n²)', espaco: 'O(1)', estavel: 'Sim' },
    },
    selection: {
      id: 'selection', arquivo: 'selection_sort.c', nome: 'Selection Sort', funcao: 'selectionSort',
      rotuloTrocas: 'trocas', src: SELECTION,
      resumo: [
        'A cada rodada, procura o menor valor do trecho que ainda não foi ordenado.',
        'Depois troca esse menor valor com o elemento da posição i, que passa a ser definitiva.',
        'Faz no máximo n - 1 trocas, mas sempre compara tudo: o custo de comparações não depende da ordem inicial.',
      ],
      complexidade: { melhor: 'O(n²)', medio: 'O(n²)', pior: 'O(n²)', espaco: 'O(1)', estavel: 'Não' },
    },
    insertion: {
      id: 'insertion', arquivo: 'insertion_sort.c', nome: 'Insertion Sort', funcao: 'insertionSort',
      rotuloTrocas: 'deslocamentos', src: INSERTION,
      resumo: [
        'Como organizar cartas na mão: a parte da esquerda já está ordenada entre si.',
        'Pega o próximo elemento (a chave), empurra para a direita os maiores que ele e encaixa a chave no buraco.',
        'Muito rápido em vetores quase ordenados, porque quase não há deslocamentos.',
      ],
      complexidade: { melhor: 'O(n)', medio: 'O(n²)', pior: 'O(n²)', espaco: 'O(1)', estavel: 'Sim' },
    },
    quick: {
      id: 'quick', arquivo: 'quick_sort.c', nome: 'Quick Sort', funcao: 'quickSort',
      rotuloTrocas: 'trocas', src: QUICK,
      resumo: [
        'Escolhe um pivô (aqui, o último elemento da fatia) e reorganiza: menores à esquerda, maiores à direita.',
        'O pivô cai na posição definitiva. Depois o mesmo processo é repetido, recursivamente, em cada lado.',
        'No caso médio é muito rápido. O pior caso (vetor já ordenado com este pivô) degenera para O(n²).',
      ],
      complexidade: { melhor: 'O(n log n)', medio: 'O(n log n)', pior: 'O(n²)', espaco: 'O(log n)', estavel: 'Não' },
    },
  };

  const ORDEM = ['bubble', 'selection', 'insertion', 'quick'];

  // Separa o texto das ⟦tags⟧ e guarda em qual linha cada tag está.
  const cache = {};
  function analisar(id) {
    if (!cache[id]) {
      const mapa = {};
      const linhas = ALGORITMOS[id].src.split('\n').map((txt, i) => {
        const m = txt.match(/⟦(\w+)⟧\s*$/);
        if (!m) return txt;
        mapa[m[1]] = i + 1;
        return txt.replace(/⟦\w+⟧\s*$/, '');
      });
      cache[id] = { linhas, mapa };
    }
    return cache[id];
  }

  S.ALGORITMOS = ALGORITMOS;
  S.ORDEM = ORDEM;
  S.mapaLinhas = (id) => analisar(id).mapa;
  S.montarCodigo = (id, valores) => analisar(id).linhas.map((l) => l.replace('__ARR__', valores.join(', ')));
})();
