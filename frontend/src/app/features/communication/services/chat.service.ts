import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Message, Conversation, Call } from '../models/messages.model';
import { User } from '../../front-office/pages/login/auth.service';

import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

@Injectable({ providedIn: 'root' })
export class ChatService {
  // Gateway URLs (à adapter selon votre configuration)
  private gatewayUrl = 'http://localhost:8089/communication-service/api';
  private userApiUrl = 'http://localhost:8096/EverCare/users';

  // WebSocket direct (port du communication-service)
  private webSocketUrl = 'http://localhost:8086/ws-chat';

  public uploadUrl = 'http://localhost:8089/communication-service/uploads/';

  constructor(private http: HttpClient) { }

  private getHeaders() {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // ---------- WebSocket ----------
  watchMessages(conversationId: number): Observable<Message> {
    return new Observable(observer => {
      const socket = new SockJS(this.webSocketUrl);
      const client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        debug: (str) => console.log('STOMP: ' + str),
        reconnectDelay: 5000,
      });
      client.onConnect = () => {
        client.subscribe(`/topic/messages/${conversationId}`, (payload) => {
          if (payload.body) observer.next(JSON.parse(payload.body));
        });
      };
      client.onStompError = (frame) => observer.error(frame);
      client.activate();
      return () => client.deactivate();
    });
  }

  watchCalls(conversationId: number): Observable<Call> {
    return new Observable(observer => {
      const socket = new SockJS(this.webSocketUrl);
      const client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        debug: (str) => console.log('STOMP: ' + str),
        reconnectDelay: 5000,
      });
      client.onConnect = () => {
        client.subscribe(`/topic/calls/${conversationId}`, (payload) => {
          if (payload.body) observer.next(JSON.parse(payload.body));
        });
      };
      client.onStompError = (frame) => observer.error(frame);
      client.activate();
      return () => client.deactivate();
    });
  }

  // ---------- Recherche globale (backend extrait l’email du token) ----------
  searchGlobalMessages(query: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.gatewayUrl}/messages/search?query=${query}`, { headers: this.getHeaders() });
  }

  getForbiddenWords(): Observable<string[]> {
    return this.http.get<string[]>(`${this.gatewayUrl}/messages/forbidden-words`, { headers: this.getHeaders() });
  }

  // Récupérer un utilisateur par son email
  getUserByEmail(email: string): Observable<User> {
    return this.http.get<User>(`${this.userApiUrl}/by-email`, { params: { email }, headers: this.getHeaders() });
  }

  // Récupérer tous les utilisateurs (pour la liste déroulante)
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.userApiUrl}/all`, { headers: this.getHeaders() });
  }

  // Récupérer les conversations de l’utilisateur connecté (le backend utilise le token)
  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.gatewayUrl}/conversations/user/current`, { headers: this.getHeaders() });
  }

  // Créer une conversation (user1Id = email de l’expéditeur, user2Id = email du destinataire)
  createConversation(user1Email: string, user2Email: string): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.gatewayUrl}/conversations`, { user1Id: user1Email, user2Id: user2Email }, { headers: this.getHeaders() });
  }

  archiveConversation(id: number): Observable<Conversation> {
    return this.http.put<Conversation>(`${this.gatewayUrl}/conversations/${id}/status?active=false`, {}, { headers: this.getHeaders() });
  }

  deleteConversation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.gatewayUrl}/conversations/${id}`, { headers: this.getHeaders() });
  }

  getMessages(conversationId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.gatewayUrl}/messages/conversation/${conversationId}`, { headers: this.getHeaders() });
  }

  // Envoi d’un message texte – senderId = email
  postMessage(conversationId: number, senderEmail: string, content: string): Observable<Message> {
    const params = new URLSearchParams();
    params.set('senderId', senderEmail);
    params.set('content', content);
    return this.http.post<Message>(`${this.gatewayUrl}/messages/${conversationId}?${params.toString()}`, {}, { headers: this.getHeaders() });
  }

  // Upload d’un fichier – senderId = email
  uploadFile(conversationId: number, file: File, senderEmail: string): Observable<Message> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('senderId', senderEmail);
    return this.http.post<Message>(`${this.gatewayUrl}/messages/${conversationId}/upload`, formData, { headers: this.getHeaders() });
  }

  updateMessage(messageId: number, content: string): Observable<Message> {
    return this.http.put<Message>(`${this.gatewayUrl}/messages/${messageId}`, content, {
      headers: this.getHeaders().set('Content-Type', 'text/plain')
    });
  }

  deleteMessage(messageId: number): Observable<void> {
    return this.http.delete<void>(`${this.gatewayUrl}/messages/${messageId}`, { headers: this.getHeaders() });
  }

  // Démarrer un appel – callerId = email
  startCall(conversationId: number, callerEmail: string): Observable<Call> {
    return this.http.post<Call>(`${this.gatewayUrl}/calls/${conversationId}?callerId=${callerEmail}`, {}, { headers: this.getHeaders() });
  }

  endCall(callId: number): Observable<Call> {
    return this.http.patch<Call>(`${this.gatewayUrl}/calls/end/${callId}`, {}, { headers: this.getHeaders() });
  }
} 
