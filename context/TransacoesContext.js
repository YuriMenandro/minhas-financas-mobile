// context/TransacoesContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Chave de armazenamento no banco de dados local do celular
const STORAGE_KEY = '@minhas_financas_transacoes';

// 1. Criação do Contexto
const TransacoesContext = createContext({});

// 2. Criação do Provedor (Envolve o App.js)
export function TransacoesProvider({ children }) {
  const [transacoes, setTransacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Processamento de dados centralizado (Otimização de desempenho)
  const receitas = transacoes
    .filter(t => t.tipo === 'receita')
    .reduce((acc, t) => acc + t.valor, 0);

  const despesas = transacoes
    .filter(t => t.tipo === 'despesa')
    .reduce((acc, t) => acc + t.valor, 0);

  const saldo = receitas - despesas;

  // Carrega os dados do disco rígido ao abrir o aplicativo
  useEffect(() => {
    async function carregarDados() {
      try {
        const dadosSalvos = await AsyncStorage.getItem(STORAGE_KEY);
        if (dadosSalvos) {
          setTransacoes(JSON.parse(dadosSalvos));
        }
      } catch (error) {
        console.error('Erro ao carregar transações:', error);
      } finally {
        setCarregando(false);
      }
    }
    carregarDados();
  }, []);

  // Função para injetar nova transação e persistir no disco
  async function adicionarTransacao(novaTransacao) {
    try {
      const novaLista = [novaTransacao, ...transacoes];
      setTransacoes(novaLista);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(novaLista));
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
    }
  }

  // Função para deletar transação e atualizar o disco
  async function removerTransacao(id) {
    try {
      const novaLista = transacoes.filter(t => t.id !== id);
      setTransacoes(novaLista);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(novaLista));
    } catch (error) {
      console.error('Erro ao remover transação:', error);
    }
  }

  // O Provider expõe os dados e métodos como uma API interna para as telas
  return (
    <TransacoesContext.Provider value={{
      transacoes,
      saldo,
      receitas,
      despesas,
      carregando,
      adicionarTransacao,
      removerTransacao
    }}>
      {children}
    </TransacoesContext.Provider>
  );
}

// 3. Hook Customizado (Atalho para as telas)
export function useTransacoes() {
  const contexto = useContext(TransacoesContext);
  if (!contexto) {
    throw new Error('useTransacoes deve ser usado dentro de um TransacoesProvider');
  }
  return contexto;
}