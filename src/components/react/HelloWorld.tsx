import type React from 'react';
import useSWR from 'swr';

interface HelloWorld {
  data: string;
}

const fetcher = async (key: string, init?: RequestInit): Promise<any> => {
  return fetch(key, init).then((res) => {
    return res.json() as Promise<HelloWorld | null>;
  });
}

const HelloWorld: React.FC<any> = (...props) => {
  const { data, error } = useSWR('https://tamanegido.com/helloworld', fetcher);
  if (error) return <div>failed to load</div>
  if (!data) return <div>loading...</div>

  return (
    <>
      <div className=".helloworld">
        {data.data}!
      </div>
      <style jsx="true">{`
        .helloworld {
          font-size: 100%;
          max-width: 100%;
        }
      `}</style>
    </>
  );
};
export default HelloWorld;

