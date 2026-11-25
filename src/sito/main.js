import { mount } from 'svelte';
import '../app.css';
import Sito from './Sito.svelte';

export default mount(Sito, { target: document.getElementById('sito') });
