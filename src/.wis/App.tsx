import { lazy } from "react";
import type { ComponentType } from "react";
import { useState, useEffect } from "react";
import { useRouterChange } from "wiscore/router";
import { remote } from "wiscore/runtime";

import { hasLayout } from "./layouts/Index";
import { Application as DefaultApplication } from "./pages/Index";

// @ts-ignore
window.$__wis_app__ = [
]

export function hasApplication(name: string) {
  // @ts-ignore
  return window.$__wis_app__.includes(name);
}

function getRouteParts(): string[] {
  const pathname = window.location.hash.replace("#", "").split("?")[0]

  return pathname.split("/").filter(Boolean);
}

function useApplication() {
  const [Application, setApplication] = useState<ComponentType<Record<string, unknown>>>();
  const [ready, setReady] = useState(false);
  const [basename, setBasename] = useState("/");

  async function install() {
    let [maybeLayout, maybeApp] = getRouteParts();

    let layout: string | undefined;
    if (hasLayout(maybeLayout)) {
      layout = maybeLayout;
    } else {
      maybeApp = maybeLayout;
    }

    let app: string | undefined;
    if (hasApplication(maybeApp)) {
      app = maybeApp;
    }

    const basename = [layout, app].filter(Boolean).join("/");
    if (basename) {
      setBasename(basename);
    }

    if (app) {
      setApplication(lazy(() => remote(`${app}/$application`).then((mod) => {
        // @ts-ignore
        return { default: mod.Application }
      })));
    }

    setReady(true);
  }

  function reset() {
    setApplication(undefined);
    setReady(false);
    setBasename("/");
  }

  useRouterChange(() => {
    reset();
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!ready) {
      install();
    }
  }, [ready]);

  return { Application, basename, ready };
}

export function App() {
  const { Application, basename, ready } = useApplication()

  if (!ready) {
    return null;
  }

  if (!Application) {
    return <DefaultApplication basename={basename} />
  }

  return <Application basename={basename} />
}
