import { useEffect, useState } from "react";

import { api, type PrivacyInfo } from "../api";
import { CheckIcon, ShieldIcon, SparkIcon } from "../icons";

export function AboutPage() {
  const [info, setInfo] = useState<PrivacyInfo | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setInfo(await api.privacy());
      } catch {
        setInfo({
          support_label: "Поддержка и приватность",
          support_text:
            "Если что-то не работает, напиши владельцу бота. Данные внутри Mini App " +
            "хранятся отдельно для каждого Telegram-пользователя.",
          privacy_summary:
            "У каждого пользователя свои задачи, категории и подзадачи. Доступ к данным " +
            "проверяется по Telegram initData и user id — чужие записи не смешиваются и не " +
            "показываются другим.",
        });
      }
    })();
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header__stack">
          <span className="page-header__eyebrow">
            <ShieldIcon /> о приложении
          </span>
          <div className="page-header__title-row">
            <h1>{info?.support_label ?? "Поддержка"}</h1>
          </div>
          <div className="page-header__subtitle">
            Что хранится, у кого есть доступ и что делать, если нужна помощь.
          </div>
        </div>
      </div>

      <div className="hero-card">
        <h2>Каждому — свой task space</h2>
        <div className="page-header__subtitle" style={{ marginTop: 8 }}>
          {info?.privacy_summary ?? "Загружаем…"}
        </div>
      </div>

      <div className="surface" style={{ marginBottom: 14 }}>
        <div className="surface__heading">
          <SparkIcon /> Что внутри
        </div>
        <ul className="bullet">
          <li>
            <CheckIcon /> Задачи, категории и подзадачи разделены по Telegram user id.
          </li>
          <li>
            <CheckIcon /> Данные хранятся в твоей собственной БД, к которой имеет доступ только
            этот сервис.
          </li>
          <li>
            <CheckIcon /> Mini App авторизуется через Telegram <b>initData</b> — без логинов и
            паролей.
          </li>
          <li>
            <CheckIcon /> Никакой публичной ленты, никаких чужих задач — всё видишь только ты.
          </li>
        </ul>
      </div>

      <div className="surface">
        <div className="surface__heading">
          <ShieldIcon /> Поддержка
        </div>
        <p className="page-header__subtitle" style={{ marginTop: 4 }}>
          {info?.support_text ?? ""}
        </p>
        <p className="page-header__subtitle" style={{ marginTop: 8 }}>
          В чате с ботом доступны команды <code>/help</code>, <code>/privacy</code> и{" "}
          <code>/support</code> — там короткое описание и контакты.
        </p>
      </div>
    </div>
  );
}
